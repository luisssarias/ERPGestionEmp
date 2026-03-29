<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\MovimientoInventario;
use App\Models\Producto;
use App\Models\ProveedorProductoMap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EntradaController extends Controller
{
    public function index()
    {
        return DB::table('detalle_compra as dc')
            ->join('compras as c', 'c.id_compra', '=', 'dc.id_compra')
            ->join('proveedores as p', 'p.id_proveedor', '=', 'c.id_proveedor')
            ->join('productos_proveedor as pp', 'pp.id_producto_proveedor', '=', 'dc.id_producto_proveedor')
            ->leftJoin('proveedor_producto_map as ppm', 'ppm.id_producto_proveedor', '=', 'pp.id_producto_proveedor')
            ->leftJoin('productos as pr', 'pr.id_producto', '=', 'ppm.id_producto')
            ->leftJoin('movimientos_inventario as mi', function ($join) {
                $join->on('mi.id_producto', '=', 'pr.id_producto')
                    ->where('mi.tipo', '=', 'Entrada')
                    ->whereRaw("mi.referencia like concat('Compra #', c.id_compra, '%')");
            })
            ->select([
                'c.id_compra',
                'dc.id_detalle',
                'c.id_proveedor',
                'p.nombre as proveedor_nombre',
                'p.empresa as proveedor_empresa',
                'c.fecha',
                'c.total',
                'dc.cantidad',
                'dc.precio_unitario as precio_compra',
                DB::raw('COALESCE(pr.id_producto, ppm.id_producto) as id_producto'),
                DB::raw('COALESCE(pr.nombre, pp.nombre) as producto'),
                DB::raw('"Admin" as usuario'),
                DB::raw("CASE WHEN mi.referencia IS NULL THEN '-' WHEN INSTR(mi.referencia, ' - ') > 0 THEN SUBSTRING_INDEX(mi.referencia, ' - ', -1) ELSE '-' END as observacion"),
            ])
            ->orderByDesc('dc.id_detalle')
            ->limit(100)
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_proveedor' => 'required|integer|exists:proveedores,id_proveedor',
            'id_producto' => 'required|integer|exists:productos,id_producto',
            'cantidad' => 'required|integer|min:1',
            'observacion' => 'nullable|string|max:500',
        ]);

        $relacion = DB::table('proveedor_producto_map as ppm')
            ->join('productos_proveedor as pp', 'pp.id_producto_proveedor', '=', 'ppm.id_producto_proveedor')
            ->join('productos as pr', 'pr.id_producto', '=', 'ppm.id_producto')
            ->join('proveedores as pv', 'pv.id_proveedor', '=', 'pp.id_proveedor')
            ->where('pp.id_proveedor', $data['id_proveedor'])
            ->where('ppm.id_producto', $data['id_producto'])
            ->select([
                'pp.id_producto_proveedor',
                'pp.precio_compra',
                'pr.id_producto',
                'pr.nombre as producto_nombre',
                'pr.stock as stock_actual',
                'pv.id_proveedor',
                'pv.nombre as proveedor_nombre',
                'pv.empresa as proveedor_empresa',
            ])
            ->first();

        if (!$relacion) {
            $relacion = DB::table('productos_proveedor as pp')
                ->join('productos as pr', 'pr.nombre', '=', 'pp.nombre')
                ->join('proveedores as pv', 'pv.id_proveedor', '=', 'pp.id_proveedor')
                ->where('pp.id_proveedor', $data['id_proveedor'])
                ->where('pr.id_producto', $data['id_producto'])
                ->select([
                    'pp.id_producto_proveedor',
                    'pp.precio_compra',
                    'pr.id_producto',
                    'pr.nombre as producto_nombre',
                    'pr.stock as stock_actual',
                    'pv.id_proveedor',
                    'pv.nombre as proveedor_nombre',
                    'pv.empresa as proveedor_empresa',
                ])
                ->first();

            if ($relacion) {
                ProveedorProductoMap::firstOrCreate([
                    'id_producto_proveedor' => $relacion->id_producto_proveedor,
                    'id_producto' => $relacion->id_producto,
                ]);
            }
        }

        if (!$relacion) {
            return response()->json([
                'message' => 'El producto seleccionado no esta asignado al proveedor.',
            ], 422);
        }

        $cantidad = (int) $data['cantidad'];
        $precioCompra = (float) $relacion->precio_compra;
        $total = round($precioCompra * $cantidad, 2);

        $resultado = DB::transaction(function () use ($data, $cantidad, $total, $precioCompra, $relacion) {
            $compra = Compra::create([
                'id_proveedor' => $data['id_proveedor'],
                'total' => $total,
            ]);

            $detalle = DetalleCompra::create([
                'id_compra' => $compra->id_compra,
                'id_producto_proveedor' => $relacion->id_producto_proveedor,
                'cantidad' => $cantidad,
                'precio_unitario' => $precioCompra,
            ]);

            $referencia = 'Compra #' . $compra->id_compra;

            if (!empty($data['observacion'])) {
                $referencia .= ' - ' . $data['observacion'];
            }

            MovimientoInventario::create([
                'id_producto' => $data['id_producto'],
                'cantidad' => $cantidad,
                'tipo' => 'Entrada',
                'referencia' => $referencia,
            ]);

            Producto::where('id_producto', $data['id_producto'])->increment('stock', $cantidad);

            return [
                'compra' => $compra,
                'detalle' => $detalle,
            ];
        });

        $compra = Compra::findOrFail($resultado['compra']->id_compra);
        $detalle = DetalleCompra::findOrFail($resultado['detalle']->id_detalle);

        $productoActualizado = Producto::findOrFail($data['id_producto']);

        return response()->json([
            'id_compra' => $compra->id_compra,
            'id_detalle' => $detalle->id_detalle,
            'fecha' => $compra->fecha,
            'id_proveedor' => $relacion->id_proveedor,
            'proveedor' => trim($relacion->proveedor_nombre . ' - ' . ($relacion->proveedor_empresa ?? '')),
            'id_producto' => $relacion->id_producto,
            'producto' => $relacion->producto_nombre,
            'cantidad' => $cantidad,
            'precio_compra' => $precioCompra,
            'total' => $total,
            'stock_nuevo' => (int) $productoActualizado->stock,
            'observacion' => $data['observacion'] ?? null,
        ], 201);
    }
}

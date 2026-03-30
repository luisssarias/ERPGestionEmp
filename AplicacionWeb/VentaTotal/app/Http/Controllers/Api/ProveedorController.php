<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use App\Models\ProveedorProductoMap;
use App\Models\Proveedor;
use App\Models\Compra;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProveedorController extends Controller
{
    private function backfillMapByNombre(int $idProveedor): void
    {
        $pendientes = DB::table('productos_proveedor as pp')
            ->leftJoin('proveedor_producto_map as ppm', 'ppm.id_producto_proveedor', '=', 'pp.id_producto_proveedor')
            ->where('pp.id_proveedor', $idProveedor)
            ->whereNull('ppm.id_map')
            ->select(['pp.id_producto_proveedor', 'pp.nombre'])
            ->get();

        foreach ($pendientes as $item) {
            $producto = Producto::where('nombre', $item->nombre)->first();

            if (!$producto) {
                continue;
            }

            ProveedorProductoMap::firstOrCreate([
                'id_producto_proveedor' => $item->id_producto_proveedor,
                'id_producto' => $producto->id_producto,
            ]);
        }
    }

    public function conexion()
    {
        return response()->json([
            'ok' => true,
            'message' => 'Conexion con tabla proveedores correcta',
            'total' => Proveedor::count(),
        ]);
    }

    public function index()
    {
        return Proveedor::withCount('productosProveedor')
            ->orderByDesc('id_proveedor')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:150',
            'empresa' => 'nullable|string|max:150',
            'telefono' => 'nullable|string|max:20',
            'correo' => 'nullable|email|max:100',
            'direccion' => 'nullable|string',
            'rfc' => 'nullable|string|max:20',
            'estado' => 'nullable|in:Activo,Inactivo',
        ]);

        if (!array_key_exists('estado', $data) || empty($data['estado'])) {
            $data['estado'] = 'Activo';
        }

        $proveedor = Proveedor::create($data);

        return response()->json($proveedor, 201);
    }

    public function update(Request $request, $id)
    {
        $proveedor = Proveedor::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'sometimes|required|string|max:150',
            'empresa' => 'sometimes|nullable|string|max:150',
            'telefono' => 'sometimes|nullable|string|max:20',
            'correo' => 'sometimes|nullable|email|max:100',
            'direccion' => 'sometimes|nullable|string',
            'rfc' => 'sometimes|nullable|string|max:20',
            'estado' => 'sometimes|nullable|in:Activo,Inactivo',
        ]);

        $proveedor->update($data);

        return $proveedor->fresh();
    }

    public function destroy($id)
    {
        $proveedor = Proveedor::findOrFail($id);

        $tieneCompras = Compra::where('id_proveedor', $proveedor->id_proveedor)->exists();

        if ($tieneCompras) {
            $proveedor->estado = 'Inactivo';
            $proveedor->save();

            return response()->json([
                'message' => 'El proveedor tiene entradas/compras registradas y fue cambiado a Inactivo.',
                'deleted' => false,
                'deactivated' => true,
            ], 200);
        }

        try {
            $idsProductoProveedor = ProductoProveedor::where('id_proveedor', $proveedor->id_proveedor)
                ->pluck('id_producto_proveedor');

            if ($idsProductoProveedor->isNotEmpty()) {
                ProveedorProductoMap::whereIn('id_producto_proveedor', $idsProductoProveedor)->delete();
            }

            ProductoProveedor::where('id_proveedor', $proveedor->id_proveedor)->delete();
            $proveedor->delete();

            return response()->json([
                'message' => 'Proveedor eliminado correctamente',
                'deleted' => true,
                'deactivated' => false,
            ], 200);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se puede eliminar el proveedor porque tiene registros relacionados.',
                'deleted' => false,
                'deactivated' => false,
            ], 409);
        }
    }

    public function productos($id)
    {
        Proveedor::findOrFail($id);
        $this->backfillMapByNombre((int) $id);

        return DB::table('productos_proveedor as pp')
            ->leftJoin('proveedor_producto_map as ppm', 'ppm.id_producto_proveedor', '=', 'pp.id_producto_proveedor')
            ->leftJoin('productos as p', 'p.id_producto', '=', 'ppm.id_producto')
            ->where('pp.id_proveedor', $id)
            ->select([
                'pp.id_producto_proveedor',
                'pp.id_proveedor',
                'pp.nombre',
                'pp.descripcion',
                'pp.precio_compra',
                'p.id_producto',
            ])
            ->orderBy('pp.nombre')
            ->get();
    }

    public function syncProductos(Request $request, $id)
    {
        $proveedor = Proveedor::findOrFail($id);

        $data = $request->validate([
            'productos' => 'required|array|min:1',
            'productos.*.id_producto' => 'required|integer|exists:productos,id_producto',
            'productos.*.precio_compra' => 'required|numeric|min:0',
        ]);

        $idsProducto = collect($data['productos'])
            ->pluck('id_producto')
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values();

        if ($idsProducto->count() !== count($data['productos'])) {
            return response()->json([
                'message' => 'No se permiten productos repetidos para un proveedor.',
            ], 422);
        }

        $catalogo = Producto::whereIn('id_producto', $idsProducto)->get()->keyBy('id_producto');

        if ($catalogo->count() !== $idsProducto->count()) {
            return response()->json([
                'message' => 'Uno o mas productos no existen en el catalogo.',
            ], 422);
        }

        $inserts = [];

        foreach ($data['productos'] as $item) {
            $producto = $catalogo->get((int) $item['id_producto']);

            $inserts[] = [
                'id_proveedor' => $proveedor->id_proveedor,
                'nombre' => $producto->nombre,
                'descripcion' => $producto->descripcion,
                'precio_compra' => $item['precio_compra'],
            ];
        }

        DB::transaction(function () use ($proveedor, $inserts, $data) {
            $idsActuales = ProductoProveedor::where('id_proveedor', $proveedor->id_proveedor)
                ->pluck('id_producto_proveedor');

            if ($idsActuales->isNotEmpty()) {
                ProveedorProductoMap::whereIn('id_producto_proveedor', $idsActuales)->delete();
            }

            ProductoProveedor::where('id_proveedor', $proveedor->id_proveedor)->delete();

            foreach ($inserts as $index => $insert) {
                $productoProveedor = ProductoProveedor::create($insert);

                ProveedorProductoMap::create([
                    'id_producto_proveedor' => $productoProveedor->id_producto_proveedor,
                    'id_producto' => (int) $data['productos'][$index]['id_producto'],
                ]);
            }
        });

        return response()->json([
            'message' => 'Productos del proveedor actualizados correctamente.',
        ], 200);
    }
}

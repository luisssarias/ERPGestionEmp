<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DetalleVenta;
use App\Models\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function index()
    {
        $ventas = Venta::with(['detalles', 'factura'])
            ->orderByDesc('id_venta')
            ->get();

        return response()->json($ventas->map(fn ($venta) => $this->transformVenta($venta)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'cliente' => 'nullable|string|max:150',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
            'estado' => 'nullable|in:completada,pendiente,cancelada',
            'observaciones' => 'nullable|string',
            'detalle' => 'required|array|min:1',
            'detalle.*.id_producto' => 'nullable|integer',
            'detalle.*.codigo' => 'nullable|string|max:50',
            'detalle.*.nombre' => 'required|string|max:150',
            'detalle.*.descripcion' => 'nullable|string',
            'detalle.*.cantidad' => 'required|integer|min:1',
            'detalle.*.precio_unitario' => 'required|numeric|min:0',
            'detalle.*.subtotal' => 'nullable|numeric|min:0',
        ]);

        $user = $request->user();

        $venta = DB::transaction(function () use ($data, $user) {
            $subtotal = 0;

            foreach ($data['detalle'] as $item) {
                $linea = number_format(
                    $item['subtotal'] ?? ((float) $item['precio_unitario'] * (int) $item['cantidad']),
                    2,
                    '.',
                    ''
                );

                $subtotal += (float) $linea;
            }

            $impuesto = (float) number_format($subtotal * 0.16, 2, '.', '');
            $total = (float) number_format($subtotal + $impuesto, 2, '.', '');

            $venta = Venta::create([
                'folio' => $this->generateFolio(),
                'fecha_venta' => now(),
                'id_usuario' => $user?->id_usuario,
                'cliente_nombre' => $data['cliente'] ?? null,
                'metodo_pago' => $data['metodo_pago'],
                'estado' => $data['estado'] ?? 'completada',
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'observaciones' => $data['observaciones'] ?? null,
            ]);

            foreach ($data['detalle'] as $item) {
                $subtotalLinea = (float) number_format(
                    $item['subtotal'] ?? ((float) $item['precio_unitario'] * (int) $item['cantidad']),
                    2,
                    '.',
                    ''
                );

                DetalleVenta::create([
                    'id_venta' => $venta->id_venta,
                    'id_producto' => $item['id_producto'] ?? null,
                    'codigo_producto' => $item['codigo'] ?? null,
                    'producto_nombre' => $item['nombre'],
                    'producto_descripcion' => $item['descripcion'] ?? null,
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal_linea' => $subtotalLinea,
                ]);
            }

            return $venta->load('detalles');
        });

        return response()->json($this->transformVenta($venta), 201);
    }

    public function show($id)
    {
        $venta = Venta::with(['detalles', 'factura'])->findOrFail($id);
        return response()->json($this->transformVenta($venta));
    }

    public function update(Request $request, $id)
    {
        $venta = Venta::with('detalles')->findOrFail($id);

        $data = $request->validate([
            'cliente' => 'nullable|string|max:150',
            'metodo_pago' => 'sometimes|required|in:efectivo,tarjeta,transferencia',
            'estado' => 'sometimes|required|in:completada,pendiente,cancelada',
            'observaciones' => 'nullable|string',
            'detalle' => 'sometimes|array|min:1',
            'detalle.*.id_producto' => 'nullable|integer',
            'detalle.*.codigo' => 'nullable|string|max:50',
            'detalle.*.nombre' => 'required_with:detalle|string|max:150',
            'detalle.*.descripcion' => 'nullable|string',
            'detalle.*.cantidad' => 'required_with:detalle|integer|min:1',
            'detalle.*.precio_unitario' => 'required_with:detalle|numeric|min:0',
            'detalle.*.subtotal' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($venta, $data) {
            $venta->cliente_nombre = $data['cliente'] ?? $venta->cliente_nombre;
            $venta->observaciones = $data['observaciones'] ?? $venta->observaciones;

            if (array_key_exists('metodo_pago', $data)) {
                $venta->metodo_pago = $data['metodo_pago'];
            }

            if (array_key_exists('estado', $data)) {
                $venta->estado = $data['estado'];
            }

            if (array_key_exists('detalle', $data)) {
                $venta->detalles()->delete();

                $subtotal = 0;
                foreach ($data['detalle'] as $item) {
                    $subtotalLinea = (float) number_format(
                        $item['subtotal'] ?? ((float) $item['precio_unitario'] * (int) $item['cantidad']),
                        2,
                        '.',
                        ''
                    );

                    $subtotal += $subtotalLinea;

                    DetalleVenta::create([
                        'id_venta' => $venta->id_venta,
                        'id_producto' => $item['id_producto'] ?? null,
                        'codigo_producto' => $item['codigo'] ?? null,
                        'producto_nombre' => $item['nombre'],
                        'producto_descripcion' => $item['descripcion'] ?? null,
                        'cantidad' => $item['cantidad'],
                        'precio_unitario' => $item['precio_unitario'],
                        'subtotal_linea' => $subtotalLinea,
                    ]);
                }

                $venta->subtotal = (float) number_format($subtotal, 2, '.', '');
                $venta->impuesto = (float) number_format($subtotal * 0.16, 2, '.', '');
                $venta->total = (float) number_format($venta->subtotal + $venta->impuesto, 2, '.', '');
            }

            $venta->save();
        });

        return response()->json($this->transformVenta($venta->fresh()->load('detalles')));
    }

    public function destroy($id)
    {
        $venta = Venta::findOrFail($id);
        $venta->delete();

        return response()->json([
            'message' => 'Venta eliminada correctamente',
        ]);
    }

    private function transformVenta(Venta $venta): array
    {
        return [
            'id_venta' => $venta->id_venta,
            'folio' => $venta->folio,
            'fecha_venta' => $venta->fecha_venta,
            'cliente' => $venta->cliente_nombre ?: 'Publico general',
            'metodo_pago' => strtolower((string) $venta->metodo_pago),
            'estado' => strtolower((string) $venta->estado),
            'subtotal' => (float) $venta->subtotal,
            'impuesto' => (float) $venta->impuesto,
            'total' => (float) $venta->total,
            'observaciones' => $venta->observaciones,
            'facturada' => (bool) $venta->factura,
            'factura' => $venta->factura ? [
                'id_factura' => $venta->factura->id_factura,
                'folio_factura' => $venta->factura->folio_factura,
                'estado' => $venta->factura->estado,
                'pdf_path' => $venta->factura->pdf_path,
            ] : null,
            'detalle' => $venta->detalles->map(function ($item) {
                return [
                    'id_producto' => $item->id_producto,
                    'codigo' => $item->codigo_producto,
                    'nombre' => $item->producto_nombre,
                    'descripcion' => $item->producto_descripcion,
                    'cantidad' => (int) $item->cantidad,
                    'precio_unitario' => (float) $item->precio_unitario,
                    'subtotal' => (float) $item->subtotal_linea,
                ];
            })->values(),
        ];
    }

    private function generateFolio(): string
    {
        $prefix = 'VTA-' . now()->format('Ymd') . '-';

        $last = Venta::where('folio', 'like', $prefix . '%')
            ->orderByDesc('id_venta')
            ->first();

        $nextNumber = 1;
        if ($last) {
            $parts = explode('-', $last->folio);
            $lastNumber = (int) end($parts);
            $nextNumber = $lastNumber + 1;
        }

        return $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use App\Models\Factura;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FacturaController extends Controller
{
    public function index()
    {
        $facturas = Factura::with(['venta', 'cliente'])
            ->orderByDesc('id_factura')
            ->get();

        return response()->json($facturas->map(fn (Factura $factura) => $this->transformFactura($factura)));
    }

    public function showByVenta(int $idVenta)
    {
        $factura = Factura::where('id_venta', $idVenta)->first();

        if (!$factura) {
            return response()->json(['message' => 'Factura no encontrada'], 404);
        }

        return response()->json($this->transformFactura($factura));
    }

    public function store(Request $request)
    {
        try {
            \Log::info('FacturaController@store: Recibido POST', $request->all());
        } catch (\Exception $e) {
            \Log::error('FacturaController@store: Error en log inicial', ['error' => $e->getMessage()]);
        }
        
        $data = $request->validate([
            'id_venta' => 'required|integer|exists:ventas,id_venta',
            'rfc' => 'required|string|max:13',
            'razon_social' => 'required|string|max:180',
            'regimen_fiscal' => 'required|string|max:10',
            'uso_cfdi' => 'required|string|max:10',
            'codigo_postal' => 'required|digits:5',
            'email_envio' => 'required|email|max:180',
            'comentarios' => 'nullable|string',
        ]);

        try {
            \Log::info('FacturaController@store: Validación pasada', $data);
        } catch (\Exception $e) {
            \Log::error('FacturaController@store: Error en validación', ['error' => $e->getMessage()]);
        }

        $venta = Venta::with('detalles')->findOrFail($data['id_venta']);

        $subtotal = (float) $venta->detalles->sum(function ($item) {
            $linea = $item->subtotal_linea;
            if ($linea === null) {
                $linea = ((float) $item->precio_unitario) * ((int) $item->cantidad);
            }

            return (float) $linea;
        });
        $subtotal = (float) number_format($subtotal, 2, '.', '');
        $iva = (float) number_format($subtotal * 0.16, 2, '.', '');
        $total = (float) number_format($subtotal + $iva, 2, '.', '');

        $detalle = $venta->detalles->map(function ($item) {
            return [
                'codigo' => $item->codigo_producto ?: 'N/A',
                'nombre' => $item->producto_nombre,
                'descripcion' => $item->producto_descripcion,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'subtotal' => (float) ($item->subtotal_linea ?? ((float) $item->precio_unitario * (int) $item->cantidad)),
            ];
        })->values()->all();

        $facturaExistente = Factura::where('id_venta', $data['id_venta'])->first();

        $folio = $facturaExistente
            ? (string) $facturaExistente->folio_factura
            : $this->generateFacturaFolio();

        $xmlPath = 'facturas/xml/' . $folio . '.xml';
        $pdfPath = 'facturas/pdf/' . $folio . '.pdf';

        $facturaData = [
            'folio_factura' => $folio,
            'fecha_emision' => now(),
            'rfc' => strtoupper(substr($data['rfc'], 0, 13)),
            'razon_social' => substr($data['razon_social'], 0, 180),
            'regimen_fiscal' => substr($data['regimen_fiscal'], 0, 10),
            'uso_cfdi' => substr($data['uso_cfdi'], 0, 10),
            'codigo_postal' => $data['codigo_postal'],
            'email_envio' => $data['email_envio'],
            'comentarios' => $data['comentarios'] ?? null,
            'subtotal' => $subtotal,
            'iva' => $iva,
            'total' => $total,
            'xml_path' => $xmlPath,
            'pdf_path' => $pdfPath,
            'estado' => 'generada',
        ];

        $xml = $this->buildXml($facturaData, $venta, $detalle);
        Storage::disk('public')->put($xmlPath, $xml);

        $pdfOutput = Pdf::loadView('facturas.pdf', [
            'factura' => $facturaData,
            'venta' => $venta,
            'detalle' => $detalle,
        ])->setPaper('letter')->output();
        Storage::disk('public')->put($pdfPath, $pdfOutput);

        if ($facturaExistente) {
            $facturaExistente->update($facturaData);
            $factura = $facturaExistente->fresh();
        } else {
            $factura = Factura::create(array_merge(
                ['id_venta' => $data['id_venta']],
                $facturaData
            ));
        }

        \Log::info('FacturaController@store: Factura completada exitosamente', ['id_factura' => $factura->id_factura]);
        return response()->json($this->transformFactura($factura), 201);
    }

    public function downloadPdf(int $idFactura)
    {
        $factura = Factura::findOrFail($idFactura);

        if (!Storage::disk('public')->exists($factura->pdf_path)) {
            return response()->json(['message' => 'No se encontro el PDF de la factura.'], 404);
        }

        return Storage::disk('public')->download(
            $factura->pdf_path,
            basename((string) $factura->pdf_path)
        );
    }

    public function reenviar(int $idFactura)
    {
        $factura = Factura::findOrFail($idFactura);
        $factura->estado = 'enviada';
        $factura->save();

        return response()->json([
            'message' => 'Reenvio simulado correctamente.',
            'email' => $factura->email_envio,
            'pdf_url' => $this->publicStorageUrl($factura->pdf_path),
        ]);
    }

    private function transformFactura(Factura $factura): array
    {
        return [
            'id_factura' => $factura->id_factura,
            'id_venta' => $factura->id_venta,
            'id_cliente' => $factura->id_cliente,
            'folio_factura' => $factura->folio_factura,
            'fecha_emision' => $factura->fecha_emision,
            'rfc' => $factura->rfc,
            'razon_social' => $factura->razon_social,
            'regimen_fiscal' => $factura->regimen_fiscal,
            'uso_cfdi' => $factura->uso_cfdi,
            'codigo_postal' => $factura->codigo_postal,
            'email_envio' => $factura->email_envio,
            'comentarios' => $factura->comentarios,
            'subtotal' => (float) $factura->subtotal,
            'iva' => (float) $factura->iva,
            'total' => (float) $factura->total,
            'estado' => $factura->estado,
            'xml_path' => $factura->xml_path,
            'pdf_path' => $factura->pdf_path,
            'xml_url' => $this->publicStorageUrl($factura->xml_path),
            'pdf_url' => $this->publicStorageUrl($factura->pdf_path),
            'cliente' => $factura->cliente ? [
                'id_cliente' => $factura->cliente->id_cliente,
                'rfc' => $factura->cliente->rfc,
                'razon_social' => $factura->cliente->razon_social,
                'regimen_fiscal' => $factura->cliente->regimen_fiscal,
                'uso_cfdi' => $factura->cliente->uso_cfdi,
                'codigo_postal' => $factura->cliente->codigo_postal,
                'correo' => $factura->cliente->correo,
            ] : null,
        ];
    }

    private function buildXml(array $facturaData, Venta $venta, array $detalle): string
    {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><FacturaSimulada/>');

        $xml->addChild('Version', '1.0');
        $xml->addChild('SimuladaSAT', 'true');
        $xml->addChild('Folio', $facturaData['folio_factura']);
        $xml->addChild('FechaEmision', $facturaData['fecha_emision']);

        $ventaNode = $xml->addChild('Venta');
        $ventaNode->addChild('IdVenta', (string) $venta->id_venta);
        $ventaNode->addChild('FolioVenta', (string) $venta->folio);
        $ventaNode->addChild('FechaVenta', (string) $venta->fecha_venta);

        $receptor = $xml->addChild('Receptor');
        $receptor->addChild('RFC', $facturaData['rfc']);
        $receptor->addChild('RazonSocial', htmlspecialchars($facturaData['razon_social']));
        $receptor->addChild('RegimenFiscal', $facturaData['regimen_fiscal']);
        $receptor->addChild('UsoCFDI', $facturaData['uso_cfdi']);
        $receptor->addChild('CodigoPostal', $facturaData['codigo_postal']);
        $receptor->addChild('Email', htmlspecialchars($facturaData['email_envio']));

        $conceptos = $xml->addChild('Conceptos');
        foreach ($detalle as $item) {
            $concepto = $conceptos->addChild('Concepto');
            $concepto->addChild('Codigo', htmlspecialchars((string) $item['codigo']));
            $concepto->addChild('Nombre', htmlspecialchars((string) $item['nombre']));
            $concepto->addChild('Cantidad', (string) $item['cantidad']);
            $concepto->addChild('PrecioUnitario', number_format((float) $item['precio_unitario'], 2, '.', ''));
            $concepto->addChild('Subtotal', number_format((float) $item['subtotal'], 2, '.', ''));
        }

        $totales = $xml->addChild('Totales');
        $totales->addChild('Subtotal', number_format((float) $facturaData['subtotal'], 2, '.', ''));
        $totales->addChild('IVA', number_format((float) $facturaData['iva'], 2, '.', ''));
        $totales->addChild('Total', number_format((float) $facturaData['total'], 2, '.', ''));

        if (!empty($facturaData['comentarios'])) {
            $xml->addChild('Comentarios', htmlspecialchars((string) $facturaData['comentarios']));
        }

        return $xml->asXML() ?: '';
    }

    private function generateFacturaFolio(): string
    {
        $prefix = 'FAC-' . now()->format('Ymd') . '-';

        $last = Factura::where('folio_factura', 'like', $prefix . '%')
            ->orderByDesc('id_factura')
            ->first();

        $nextNumber = 1;
        if ($last) {
            $parts = explode('-', (string) $last->folio_factura);
            $lastNumber = (int) end($parts);
            $nextNumber = $lastNumber + 1;
        }

        return $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }

    private function publicStorageUrl(string $path): string
    {
        return url('storage/' . ltrim($path, '/'));
    }
}

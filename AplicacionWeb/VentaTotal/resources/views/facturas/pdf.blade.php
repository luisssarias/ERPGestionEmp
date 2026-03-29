<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Factura {{ $factura['folio_factura'] }}</title>
<style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1f2937; }
    .header { margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 20px; }
    .muted { color: #6b7280; }
    .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
    .row { width: 100%; }
    .col { width: 50%; vertical-align: top; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: left; }
    th { background: #f8fafc; }
    .totales { width: 40%; margin-left: auto; margin-top: 10px; }
    .totales td { border: none; padding: 4px 0; }
    .totales .total td { font-weight: bold; border-top: 1px solid #d1d5db; padding-top: 8px; }
</style>
</head>
<body>
    <div class="header">
        <h1>Factura Simulada</h1>
        <p class="muted">Folio: {{ $factura['folio_factura'] }} | Fecha: {{ $factura['fecha_emision'] }}</p>
    </div>

    <table class="row">
        <tr>
            <td class="col">
                <div class="box">
                    <strong>Emisor</strong><br>
                    VentaTotal ERP<br>
                    RFC: VTN010101AAA
                </div>
            </td>
            <td class="col">
                <div class="box">
                    <strong>Receptor</strong><br>
                    {{ $factura['razon_social'] }}<br>
                    RFC: {{ $factura['rfc'] }}<br>
                    Regimen: {{ $factura['regimen_fiscal'] }}<br>
                    Uso CFDI: {{ $factura['uso_cfdi'] }}<br>
                    CP: {{ $factura['codigo_postal'] }}<br>
                    Email: {{ $factura['email_envio'] }}
                </div>
            </td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th>Codigo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($detalle as $item)
            <tr>
                <td>{{ $item['codigo'] }}</td>
                <td>{{ $item['nombre'] }}</td>
                <td>{{ $item['cantidad'] }}</td>
                <td>${{ number_format($item['precio_unitario'], 2) }}</td>
                <td>${{ number_format($item['subtotal'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totales">
        <tr><td>Subtotal:</td><td>${{ number_format($factura['subtotal'], 2) }}</td></tr>
        <tr><td>IVA (16%):</td><td>${{ number_format($factura['iva'], 2) }}</td></tr>
        <tr class="total"><td>Total:</td><td>${{ number_format($factura['total'], 2) }}</td></tr>
    </table>

    @if (!empty($factura['comentarios']))
        <div class="box">
            <strong>Comentarios:</strong><br>
            {{ $factura['comentarios'] }}
        </div>
    @endif

    <p class="muted" style="margin-top: 20px;">Documento de simulacion CFDI. No timbrado ante SAT.</p>
</body>
</html>

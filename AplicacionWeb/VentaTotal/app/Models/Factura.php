<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Factura extends Model
{
    protected $table = 'facturas';
    protected $primaryKey = 'id_factura';

    protected $fillable = [
        'id_venta',
        'id_cliente',
        'folio_factura',
        'fecha_emision',
        'rfc',
        'razon_social',
        'regimen_fiscal',
        'uso_cfdi',
        'codigo_postal',
        'email_envio',
        'comentarios',
        'subtotal',
        'iva',
        'total',
        'xml_path',
        'pdf_path',
        'estado',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_cliente');
    }
}

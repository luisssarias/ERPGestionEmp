<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleVenta extends Model
{
    protected $table = 'detalle_ventas';
    protected $primaryKey = 'id_detalle';

    protected $fillable = [
        'id_venta',
        'id_producto',
        'codigo_producto',
        'producto_nombre',
        'producto_descripcion',
        'cantidad',
        'precio_unitario',
        'subtotal_linea',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }
}

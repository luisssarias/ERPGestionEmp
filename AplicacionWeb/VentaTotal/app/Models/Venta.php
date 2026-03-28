<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';
    protected $primaryKey = 'id_venta';

    protected $fillable = [
        'folio',
        'fecha_venta',
        'id_usuario',
        'cliente_nombre',
        'metodo_pago',
        'estado',
        'subtotal',
        'impuesto',
        'total',
        'observaciones',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuarios::class, 'id_usuario', 'id_usuario');
    }

    public function detalles()
    {
        return $this->hasMany(DetalleVenta::class, 'id_venta', 'id_venta');
    }
}

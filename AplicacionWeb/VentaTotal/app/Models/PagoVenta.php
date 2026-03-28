<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PagoVenta extends Model
{
    protected $table = 'pagos_venta';
    protected $primaryKey = 'id_pago';

    protected $fillable = [
        'id_venta',
        'metodo_pago',
        'monto',
        'referencia',
        'fecha_pago',
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta', 'id_venta');
    }
}

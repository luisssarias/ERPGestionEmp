<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';
    protected $primaryKey = 'id_cliente';

    protected $fillable = [
        'nombre',
        'correo',
        'telefono',
        'direccion',
        'rfc',
        'razon_social',
        'regimen_fiscal',
        'uso_cfdi',
        'codigo_postal',
    ];

    public function facturas()
    {
        return $this->hasMany(Factura::class, 'id_cliente', 'id_cliente');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    public function index()
    {
        $productos = DB::table('productos')
            ->leftJoin('categorias', 'productos.id_categoria', '=', 'categorias.id_categoria')
            ->select([
                'productos.id_producto',
                'productos.codigo',
                'productos.nombre',
                'productos.descripcion',
                'productos.precio',
                'productos.stock',
                'productos.imagen',
                DB::raw('COALESCE(categorias.nombre, "Sin categoria") as categoria'),
            ])
            ->orderByDesc('productos.id_producto')
            ->get();

        return response()->json($productos);
    }
}

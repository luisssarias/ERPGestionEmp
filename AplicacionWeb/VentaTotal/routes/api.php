<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\EntradaController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/test', function () {
    return 'FUNCIONA';
});

Route::get('/proveedores/conexion', [ProveedorController::class, 'conexion']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('usuarios', UsuarioController::class);
    Route::get('/categorias', [ProductoController::class, 'categorias']);
    Route::post('/categorias', [ProductoController::class, 'storeCategoria']);
    Route::get('/estados-producto', [ProductoController::class, 'estados']);
    Route::apiResource('productos', ProductoController::class);
    Route::get('/proveedores', [ProveedorController::class, 'index']);
    Route::post('/proveedores', [ProveedorController::class, 'store']);
    Route::put('/proveedores/{id}', [ProveedorController::class, 'update']);
    Route::delete('/proveedores/{id}', [ProveedorController::class, 'destroy']);
    Route::get('/proveedores/{id}/productos', [ProveedorController::class, 'productos']);
    Route::post('/proveedores/{id}/productos', [ProveedorController::class, 'syncProductos']);
    Route::get('/entradas', [EntradaController::class, 'index']);
    Route::post('/entradas', [EntradaController::class, 'store']);

});
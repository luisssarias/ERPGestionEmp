<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\VentaController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/test', function () {
    return 'FUNCIONA';
});

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/productos', [ProductoController::class, 'index']);
    Route::apiResource('usuarios', UsuarioController::class);
    Route::apiResource('ventas', VentaController::class);

});
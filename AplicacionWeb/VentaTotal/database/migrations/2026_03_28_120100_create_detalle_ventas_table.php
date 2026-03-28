<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('detalle_ventas')) {
            Schema::create('detalle_ventas', function (Blueprint $table) {
                $table->id('id_detalle');

                $table->unsignedBigInteger('id_venta');
                $table->unsignedBigInteger('id_producto')->nullable();

                $table->string('codigo_producto', 50)->nullable();
                $table->string('producto_nombre', 150);
                $table->text('producto_descripcion')->nullable();

                $table->integer('cantidad')->default(1);
                $table->decimal('precio_unitario', 10, 2)->default(0);
                $table->decimal('subtotal_linea', 10, 2)->default(0);

                $table->timestamps();

                $table->foreign('id_venta')
                    ->references('id_venta')
                    ->on('ventas')
                    ->cascadeOnDelete();

                $table->foreign('id_producto')
                    ->references('id_producto')
                    ->on('productos')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_ventas');
    }
};

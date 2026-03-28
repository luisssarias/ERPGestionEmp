<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('ventas')) {
            Schema::create('ventas', function (Blueprint $table) {
                $table->id('id_venta');
                $table->string('folio', 30)->unique();
                $table->dateTime('fecha_venta');

                $table->unsignedBigInteger('id_usuario')->nullable();
                $table->string('cliente_nombre', 150)->nullable();

                $table->enum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia'])->default('efectivo');
                $table->enum('estado', ['completada', 'pendiente', 'cancelada'])->default('completada');

                $table->decimal('subtotal', 10, 2)->default(0);
                $table->decimal('impuesto', 10, 2)->default(0);
                $table->decimal('total', 10, 2)->default(0);

                $table->text('observaciones')->nullable();
                $table->timestamps();

                $table->foreign('id_usuario')
                    ->references('id_usuario')
                    ->on('usuarios')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('facturas', function (Blueprint $table) {
            $table->id('id_factura');
            $table->unsignedBigInteger('id_venta')->unique();
            $table->integer('id_cliente')->nullable();
            $table->string('folio_factura', 40)->unique();
            $table->dateTime('fecha_emision');

            $table->string('rfc', 13);
            $table->string('razon_social', 180);
            $table->string('regimen_fiscal', 10);
            $table->string('uso_cfdi', 10);
            $table->string('codigo_postal', 5);
            $table->string('email_envio', 180);
            $table->text('comentarios')->nullable();

            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('iva', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);

            $table->string('xml_path', 255);
            $table->string('pdf_path', 255);
            $table->enum('estado', ['generada', 'enviada', 'cancelada'])->default('generada');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};

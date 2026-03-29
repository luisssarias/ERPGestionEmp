<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Primero verificar si la tabla existe, si no, crearla
        if (!Schema::hasTable('clientes')) {
            Schema::create('clientes', function (Blueprint $table) {
                $table->integer('id_cliente')->primary();
                $table->string('nombre', 255);
                $table->string('telefono', 20)->nullable();
                $table->string('correo', 255)->nullable();
                $table->text('direccion')->nullable();
                $table->string('rfc', 13)->unique()->nullable();
                $table->string('razon_social', 180)->nullable();
                $table->string('regimen_fiscal', 10)->nullable();
                $table->string('uso_cfdi', 10)->nullable();
                $table->string('codigo_postal', 5)->nullable();
                $table->timestamps();
            });
        } else {
            // Si la tabla ya existe, solo agregar las columnas faltantes
            Schema::table('clientes', function (Blueprint $table) {
                if (!Schema::hasColumn('clientes', 'rfc')) {
                    $table->string('rfc', 13)->unique()->nullable();
                }
                if (!Schema::hasColumn('clientes', 'razon_social')) {
                    $table->string('razon_social', 180)->nullable();
                }
                if (!Schema::hasColumn('clientes', 'regimen_fiscal')) {
                    $table->string('regimen_fiscal', 10)->nullable();
                }
                if (!Schema::hasColumn('clientes', 'uso_cfdi')) {
                    $table->string('uso_cfdi', 10)->nullable();
                }
                if (!Schema::hasColumn('clientes', 'codigo_postal')) {
                    $table->string('codigo_postal', 5)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('clientes')) {
            Schema::table('clientes', function (Blueprint $table) {
                if (Schema::hasColumn('clientes', 'rfc')) {
                    $table->dropUnique(['rfc']);
                    $table->dropColumn('rfc');
                }
                if (Schema::hasColumn('clientes', 'razon_social')) {
                    $table->dropColumn('razon_social');
                }
                if (Schema::hasColumn('clientes', 'regimen_fiscal')) {
                    $table->dropColumn('regimen_fiscal');
                }
                if (Schema::hasColumn('clientes', 'uso_cfdi')) {
                    $table->dropColumn('uso_cfdi');
                }
                if (Schema::hasColumn('clientes', 'codigo_postal')) {
                    $table->dropColumn('codigo_postal');
                }
            });
        }
    }
};

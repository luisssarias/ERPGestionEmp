<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tabla pagos_venta ya existe en la BD, no ejecutar
        // Se dejará como referencia documentación de estructura esperada
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos_venta');
    }
};

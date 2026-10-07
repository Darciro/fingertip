<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `settled` indica se a despesa já foi paga ou se a receita já foi recebida.
     */
    public function up(): void
    {
        foreach (['expenses', 'incomes'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->boolean('settled')->default(false)->after('category');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['expenses', 'incomes'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('settled');
            });
        }
    }
};

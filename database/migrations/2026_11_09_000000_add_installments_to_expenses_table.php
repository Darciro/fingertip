<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Uma despesa parcelada é gravada como uma linha por parcela, todas com o mesmo
     * `installment_group`. `installment` é o número da parcela (1, 2, …) e
     * `installments` o total de parcelas. Despesas à vista ficam com as três colunas nulas.
     */
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->uuid('installment_group')->nullable()->after('settled')->index();
            $table->unsignedSmallInteger('installment')->nullable()->after('installment_group');
            $table->unsignedSmallInteger('installments')->nullable()->after('installment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['installment_group']);
            $table->dropColumn(['installment_group', 'installment', 'installments']);
        });
    }
};

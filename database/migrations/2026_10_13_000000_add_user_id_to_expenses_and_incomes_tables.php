<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var list<string> */
    private array $tables = ['expenses', 'incomes'];

    /**
     * Run the migrations.
     *
     * Cada movimentação passa a pertencer a um usuário. As movimentações criadas antes
     * da autenticação existir são atribuídas ao primeiro usuário cadastrado, que deve
     * ser criado manualmente antes de rodar esta migration.
     */
    public function up(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
                $table->index(['user_id', 'date']);
            });
        }

        if ($this->hasOrphans()) {
            $owner = DB::table('users')->orderBy('id')->value('id');

            foreach ($this->tables as $table) {
                DB::table($table)->whereNull('user_id')->update(['user_id' => $owner]);
            }
        }

        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('user_id')->nullable(false)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropIndex(['user_id', 'date']);
                $table->dropConstrainedForeignId('user_id');
            });
        }
    }

    private function hasOrphans(): bool
    {
        foreach ($this->tables as $table) {
            if (DB::table($table)->whereNull('user_id')->exists()) {
                return true;
            }
        }

        return false;
    }
};

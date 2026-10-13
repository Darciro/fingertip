<?php

namespace App\Policies;

use App\Models\Income;
use App\Models\User;

class IncomePolicy
{
    /**
     * Só o dono pode excluir as próprias receitas.
     */
    public function delete(User $user, Income $income): bool
    {
        return $income->user_id === $user->id;
    }
}

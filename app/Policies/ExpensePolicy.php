<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    /**
     * Só o dono pode excluir as próprias despesas.
     */
    public function delete(User $user, Expense $expense): bool
    {
        return $expense->user_id === $user->id;
    }
}

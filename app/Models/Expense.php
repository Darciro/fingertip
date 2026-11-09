<?php

namespace App\Models;

use App\Enums\ExpenseCategory;
use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $description
 * @property float $amount
 * @property Carbon $date
 * @property ExpenseCategory $category
 * @property bool $settled
 * @property string|null $installment_group
 * @property int|null $installment
 * @property int|null $installments
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 */
#[Fillable(['description', 'amount', 'date', 'category', 'settled', 'installment_group', 'installment', 'installments'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use HasFactory;

    /**
     * Usuário dono da movimentação.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'settled' => 'boolean',
            'installment' => 'integer',
            'installments' => 'integer',
            'date' => 'date:Y-m-d',
            'category' => ExpenseCategory::class,
        ];
    }
}

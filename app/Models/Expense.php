<?php

namespace App\Models;

use App\Enums\ExpenseCategory;
use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $description
 * @property float $amount
 * @property Carbon $date
 * @property ExpenseCategory $category
 * @property bool $settled
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['description', 'amount', 'date', 'category', 'settled'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use HasFactory;

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
            'date' => 'date:Y-m-d',
            'category' => ExpenseCategory::class,
        ];
    }
}

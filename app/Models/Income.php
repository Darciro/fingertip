<?php

namespace App\Models;

use App\Enums\IncomeCategory;
use Database\Factories\IncomeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $description
 * @property float $amount
 * @property Carbon $date
 * @property IncomeCategory $category
 * @property bool $settled
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['description', 'amount', 'date', 'category', 'settled'])]
class Income extends Model
{
    /** @use HasFactory<IncomeFactory> */
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
            'category' => IncomeCategory::class,
        ];
    }
}

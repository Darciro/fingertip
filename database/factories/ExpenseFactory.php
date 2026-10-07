<?php

namespace Database\Factories;

use App\Enums\ExpenseCategory;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'description' => fake()->words(2, true),
            'amount' => fake()->randomFloat(2, 5, 500),
            'date' => fake()->dateTimeBetween('-2 months')->format('Y-m-d'),
            'category' => fake()->randomElement(ExpenseCategory::cases()),
            'settled' => fake()->boolean(70),
        ];
    }
}

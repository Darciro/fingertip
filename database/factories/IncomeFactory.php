<?php

namespace Database\Factories;

use App\Enums\IncomeCategory;
use App\Models\Income;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Income>
 */
class IncomeFactory extends Factory
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
            'amount' => fake()->randomFloat(2, 50, 8000),
            'date' => fake()->dateTimeBetween('-2 months')->format('Y-m-d'),
            'category' => fake()->randomElement(IncomeCategory::cases()),
            'settled' => fake()->boolean(70),
        ];
    }
}

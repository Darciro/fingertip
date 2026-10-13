<?php

use App\Models\Expense;
use App\Models\Income;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the dashboard lists incomes and expenses of the last six months', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Expense::factory()->for($user)->create(['date' => now()->toDateString(), 'amount' => 412.4, 'settled' => true]);
    Expense::factory()->for($user)->create(['date' => now()->subMonths(6)->startOfMonth()->toDateString()]);
    Income::factory()->for($user)->create(['date' => now()->toDateString(), 'amount' => 6200, 'settled' => false]);
    Income::factory()->for($user)->create(['date' => now()->subMonths(6)->toDateString()]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('budget', 4500)
            ->has('expenses', 1)
            ->where('expenses.0.amount', 412.4)
            ->where('expenses.0.date', now()->toDateString())
            ->where('expenses.0.settled', true)
            ->has('incomes', 1)
            ->where('incomes.0.amount', 6200)
            ->where('incomes.0.settled', false)
        );
});

test('the dashboard only lists the logged user records', function () {
    $this->actingAs(User::factory()->create());

    Expense::factory()->create(['date' => now()->toDateString()]);
    Income::factory()->create(['date' => now()->toDateString()]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('expenses', 0)
            ->has('incomes', 0)
        );
});

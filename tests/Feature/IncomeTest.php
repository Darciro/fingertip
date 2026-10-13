<?php

use App\Enums\IncomeCategory;
use App\Models\Income;

test('an income is stored from the form', function () {
    $this->post(route('incomes.store'), [
        'description' => 'Salário',
        'amount' => '1.234,56',
        'date' => '2026-10-06',
        'category' => 'salario',
        'settled' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $income = Income::sole();
    expect($income->description)->toBe('Salário')
        ->and($income->amount)->toBe(1234.56)
        ->and($income->date->toDateString())->toBe('2026-10-06')
        ->and($income->settled)->toBeFalse()
        ->and($income->category)->toBe(IncomeCategory::Salario);
});

test('the form is validated', function (array $input, string $field, string $message) {
    $valid = ['description' => 'Freela', 'amount' => '96,30', 'date' => '2026-10-06', 'settled' => true, 'category' => 'freelance'];

    $this->post(route('incomes.store'), [...$valid, ...$input])
        ->assertSessionHasErrors([$field => $message]);

    expect(Income::count())->toBe(0);
})->with([
    'sem descrição' => [['description' => ''], 'description', 'Informe uma descrição.'],
    'valor zero' => [['amount' => '0'], 'amount', 'Informe um valor maior que zero.'],
    'valor inválido' => [['amount' => 'abc'], 'amount', 'Informe um valor válido, ex.: 1.234,56.'],
    'três casas decimais' => [['amount' => '1,234'], 'amount', 'Use no máximo duas casas decimais.'],
    'sem data' => [['date' => ''], 'date', 'Informe a data.'],
    'data inválida' => [['date' => '06/10/2026'], 'date', 'Informe uma data válida.'],
    'sem situação' => [['settled' => null], 'settled', 'Informe se já foi paga/recebida.'],
    'categoria inexistente' => [['category' => 'viagem'], 'category', 'Escolha uma categoria válida.'],
    'categoria de despesa' => [['category' => 'moradia'], 'category', 'Escolha uma categoria válida.'],
]);

test('an income can be deleted', function () {
    $income = Income::factory()->create();

    $this->delete(route('incomes.destroy', $income))->assertRedirect();

    expect(Income::count())->toBe(0);
});

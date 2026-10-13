<?php

use App\Enums\ExpenseCategory;
use App\Models\Expense;

test('an expense is stored from the form', function () {
    $this->post(route('expenses.store'), [
        'description' => 'Supermercado',
        'amount' => '1.234,56',
        'date' => '2026-10-06',
        'category' => 'alimentacao',
        'settled' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $expense = Expense::sole();
    expect($expense->description)->toBe('Supermercado')
        ->and($expense->amount)->toBe(1234.56)
        ->and($expense->date->toDateString())->toBe('2026-10-06')
        ->and($expense->settled)->toBeFalse()
        ->and($expense->category)->toBe(ExpenseCategory::Alimentacao);
});

test('the form is validated', function (array $input, string $field, string $message) {
    $valid = ['description' => 'Feira', 'amount' => '96,30', 'date' => '2026-10-06', 'settled' => true, 'category' => 'lazer'];

    $this->post(route('expenses.store'), [...$valid, ...$input])
        ->assertSessionHasErrors([$field => $message]);

    expect(Expense::count())->toBe(0);
})->with([
    'sem descrição' => [['description' => ''], 'description', 'Informe uma descrição.'],
    'valor zero' => [['amount' => '0'], 'amount', 'Informe um valor maior que zero.'],
    'valor inválido' => [['amount' => 'abc'], 'amount', 'Informe um valor válido, ex.: 1.234,56.'],
    'três casas decimais' => [['amount' => '1,234'], 'amount', 'Use no máximo duas casas decimais.'],
    'sem data' => [['date' => ''], 'date', 'Informe a data.'],
    'data inválida' => [['date' => '06/10/2026'], 'date', 'Informe uma data válida.'],
    'sem situação' => [['settled' => null], 'settled', 'Informe se já foi paga/recebida.'],
    'categoria inexistente' => [['category' => 'viagem'], 'category', 'Escolha uma categoria válida.'],
    'categoria de receita' => [['category' => 'salario'], 'category', 'Escolha uma categoria válida.'],
]);

test('an expense can be deleted', function () {
    $expense = Expense::factory()->create();

    $this->delete(route('expenses.destroy', $expense))->assertRedirect();

    expect(Expense::count())->toBe(0);
});

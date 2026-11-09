<?php

use App\Enums\ExpenseCategory;
use App\Models\Expense;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('an expense is stored from the form', function () {
    $this->post(route('expenses.store'), [
        'description' => 'Supermercado',
        'amount' => '1.234,56',
        'date' => '2026-10-06',
        'category' => 'alimentacao',
        'settled' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $expense = Expense::sole();
    expect($expense->user_id)->toBe($this->user->id)
        ->and($expense->description)->toBe('Supermercado')
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
    $expense = Expense::factory()->for($this->user)->create();

    $this->delete(route('expenses.destroy', $expense))->assertRedirect();

    expect(Expense::count())->toBe(0);
});

test('another user expense cannot be deleted', function () {
    $expense = Expense::factory()->create();

    $this->delete(route('expenses.destroy', $expense))->assertForbidden();

    expect(Expense::count())->toBe(1);
});

test('an expense split in installments creates one expense per month', function () {
    $this->post(route('expenses.store'), [
        'description' => 'Notebook',
        'amount' => '1.000,00',
        'date' => '2026-11-30',
        'category' => 'outros',
        'settled' => true,
        'installments' => 3,
        'installment_value' => 'total',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $expenses = Expense::orderBy('installment')->get();

    expect($expenses)->toHaveCount(3)
        ->and($expenses->pluck('amount')->all())->toBe([333.34, 333.33, 333.33])
        ->and($expenses->pluck('date')->map->toDateString()->all())->toBe(['2026-11-30', '2026-12-30', '2027-01-30'])
        ->and($expenses->pluck('settled')->all())->toBe([true, false, false])
        ->and($expenses->pluck('installment')->all())->toBe([1, 2, 3])
        ->and($expenses->pluck('installments')->unique()->all())->toBe([3])
        ->and($expenses->pluck('installment_group')->unique())->toHaveCount(1)
        ->and($expenses->pluck('description')->unique()->all())->toBe(['Notebook']);
});

test('the installment dates do not overflow into the following month', function () {
    $this->post(route('expenses.store'), [
        'description' => 'Curso',
        'amount' => '100,00',
        'date' => '2027-01-31',
        'category' => 'outros',
        'settled' => false,
        'installments' => 2,
        'installment_value' => 'installment',
    ])->assertSessionHasNoErrors();

    $expenses = Expense::orderBy('installment')->get();

    expect($expenses->pluck('date')->map->toDateString()->all())->toBe(['2027-01-31', '2027-02-28'])
        ->and($expenses->pluck('amount')->all())->toBe([100.0, 100.0]);
});

test('an expense with a single installment is stored without installment data', function () {
    $this->post(route('expenses.store'), [
        'description' => 'Feira',
        'amount' => '96,30',
        'date' => '2026-10-06',
        'category' => 'alimentacao',
        'settled' => true,
        'installments' => 1,
    ])->assertSessionHasNoErrors();

    expect(Expense::sole())
        ->installment_group->toBeNull()
        ->installment->toBeNull()
        ->installments->toBeNull();
});

test('the installments are validated', function (array $input, string $field, string $message) {
    $valid = ['description' => 'Feira', 'amount' => '96,30', 'date' => '2026-10-06', 'settled' => true, 'category' => 'lazer'];

    $this->post(route('expenses.store'), [...$valid, ...$input])
        ->assertSessionHasErrors([$field => $message]);

    expect(Expense::count())->toBe(0);
})->with([
    'zero parcelas' => [['installments' => 0], 'installments', 'Informe o número de parcelas.'],
    'parcelas demais' => [['installments' => 121], 'installments', 'São no máximo 120 parcelas.'],
    'tipo de valor inválido' => [['installments' => 2, 'installment_value' => 'x'], 'installment_value', 'Informe se o valor é o total ou o da parcela.'],
    'valor baixo demais' => [['installments' => 10, 'amount' => '0,05'], 'amount', 'O valor é baixo demais para esse número de parcelas.'],
]);

test('deleting an installment deletes the whole series', function () {
    $series = Expense::factory()->for($this->user)->count(3)->sequence(fn ($s) => ['installment' => $s->index + 1])
        ->create(['installment_group' => 'f3b0c7d2-1111-4c4c-9a9a-000000000001', 'installments' => 3]);
    $other = Expense::factory()->for($this->user)->create();

    $this->delete(route('expenses.destroy', $series[1]))->assertRedirect();

    expect(Expense::pluck('id')->all())->toBe([$other->id]);
});

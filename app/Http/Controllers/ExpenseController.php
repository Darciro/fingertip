<?php

namespace App\Http\Controllers;

use App\Enums\ExpenseCategory;
use App\Http\Controllers\Concerns\ValidatesTransaction;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    use ValidatesTransaction;

    /** Número máximo de parcelas aceito no formulário. */
    public const MAX_INSTALLMENTS = 120;

    /**
     * Valida o formulário "Nova movimentação" (tipo despesa) e grava a despesa do usuário logado.
     *
     * Uma despesa parcelada vira uma despesa por parcela, uma em cada mês a partir da data
     * informada. Só a primeira parcela recebe a situação escolhida; as seguintes ficam a pagar.
     */
    public function store(Request $request, #[CurrentUser] User $user): RedirectResponse
    {
        $data = $this->validateTransaction($request, ExpenseCategory::class);

        /** @var array{installments?: int|string|null, installment_value?: string|null} $plan */
        $plan = $request->validate([
            'installments' => ['nullable', 'integer', 'min:1', 'max:'.self::MAX_INSTALLMENTS],
            'installment_value' => ['nullable', Rule::in(['total', 'installment'])],
        ], [
            'installments.integer' => 'Informe o número de parcelas.',
            'installments.min' => 'Informe o número de parcelas.',
            'installments.max' => 'São no máximo :max parcelas.',
            'installment_value.in' => 'Informe se o valor é o total ou o da parcela.',
        ]);

        $count = (int) ($plan['installments'] ?? 1);

        if ($count <= 1) {
            $user->expenses()->create($data);

            return back();
        }

        $perInstallment = ($plan['installment_value'] ?? 'total') === 'installment';

        if (! $perInstallment && round((float) $data['amount'] * 100) < $count) {
            throw ValidationException::withMessages([
                'amount' => 'O valor é baixo demais para esse número de parcelas.',
            ]);
        }

        $amounts = self::splitAmount((float) $data['amount'], $count, $perInstallment);
        $group = (string) Str::uuid();
        $first = Carbon::createFromFormat('Y-m-d', $data['date'])->startOfDay();

        DB::transaction(function () use ($user, $data, $amounts, $group, $first, $count) {
            foreach ($amounts as $i => $amount) {
                $user->expenses()->create([
                    ...$data,
                    'amount' => $amount,
                    'date' => $first->copy()->addMonthsNoOverflow($i)->toDateString(),
                    'settled' => $i === 0 && $data['settled'],
                    'installment_group' => $group,
                    'installment' => $i + 1,
                    'installments' => $count,
                ]);
            }
        });

        return back();
    }

    /**
     * Exclui uma despesa (botão de lixeira do extrato); só o dono pode excluir.
     * Em uma despesa parcelada, todas as parcelas são excluídas.
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        Gate::authorize('delete', $expense);

        if ($expense->installment_group === null) {
            $expense->delete();
        } else {
            Expense::query()
                ->where('user_id', $expense->user_id)
                ->where('installment_group', $expense->installment_group)
                ->delete();
        }

        return back();
    }

    /**
     * Valor de cada parcela. Quando o valor informado é o total, ele é dividido em
     * centavos e a sobra da divisão vai para a primeira parcela, para que a soma bata.
     *
     * @return list<float>
     */
    public static function splitAmount(float $amount, int $count, bool $perInstallment): array
    {
        $cents = (int) round($amount * 100);

        if ($perInstallment) {
            return array_fill(0, $count, $cents / 100);
        }

        $base = intdiv($cents, $count);
        $amounts = array_fill(0, $count, $base / 100);
        $amounts[0] = ($base + $cents % $count) / 100;

        return $amounts;
    }
}

<?php

namespace App\Enums;

/**
 * Categorias de receita. Os valores precisam bater com os ids de INCOME_CATEGORIES em resources/js/lib/fingertip.ts.
 */
enum IncomeCategory: string
{
    case Salario = 'salario';
    case Freelance = 'freelance';
    case Investimentos = 'investimentos';
    case Outras = 'outras';
}

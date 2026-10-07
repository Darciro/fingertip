<?php

namespace App\Enums;

/**
 * Categorias de despesa. Os valores precisam bater com os ids de EXPENSE_CATEGORIES em resources/js/lib/fingertip.ts.
 */
enum ExpenseCategory: string
{
    case Moradia = 'moradia';
    case Alimentacao = 'alimentacao';
    case Transporte = 'transporte';
    case Saude = 'saude';
    case Lazer = 'lazer';
    case Outros = 'outros';
}

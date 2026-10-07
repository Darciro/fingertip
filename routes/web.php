<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\IncomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', DashboardController::class)->name('home');

Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

Route::post('/incomes', [IncomeController::class, 'store'])->name('incomes.store');
Route::delete('/incomes/{income}', [IncomeController::class, 'destroy'])->name('incomes.destroy');

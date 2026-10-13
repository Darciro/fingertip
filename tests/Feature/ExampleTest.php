<?php

use App\Models\User;

test('returns a successful response', function () {
    $response = $this->actingAs(User::factory()->create())->get(route('home'));

    $response->assertOk();
});

test('guests are redirected to the login page', function () {
    $this->get(route('home'))->assertRedirect(route('login'));
});

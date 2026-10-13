import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { create as login } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { store } from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import AuthLayout, { AuthField } from '@/components/auth-layout';

/** A validação é feita em RegisteredUserController::store. */
export default function Register() {
    const form = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        form.post(store.url(), {
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Criar conta"
            description="Suas movimentações ficam visíveis só para você."
            footer={
                <>
                    Já tem conta? <Link href={login.url()}>Entrar</Link>
                </>
            }
        >
            <form className="auth__form" onSubmit={submit} noValidate>
                <AuthField label="Nome" error={form.errors.name}>
                    <input
                        className="input"
                        autoComplete="name"
                        autoFocus
                        maxLength={255}
                        value={form.data.name}
                        aria-invalid={!!form.errors.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                </AuthField>
                <AuthField label="E-mail" error={form.errors.email}>
                    <input
                        className="input"
                        type="email"
                        autoComplete="username"
                        value={form.data.email}
                        aria-invalid={!!form.errors.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                </AuthField>
                <AuthField label="Senha" error={form.errors.password}>
                    <input
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mínimo de 8 caracteres"
                        value={form.data.password}
                        aria-invalid={!!form.errors.password}
                        onChange={(e) =>
                            form.setData('password', e.target.value)
                        }
                    />
                </AuthField>
                <AuthField label="Confirme a senha">
                    <input
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        value={form.data.password_confirmation}
                        onChange={(e) =>
                            form.setData(
                                'password_confirmation',
                                e.target.value,
                            )
                        }
                    />
                </AuthField>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={form.processing}
                >
                    {form.processing ? 'Criando conta…' : 'Criar conta'}
                </button>
            </form>
        </AuthLayout>
    );
}

import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { store } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { create as register } from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import AuthLayout, { AuthField } from '@/components/auth-layout';

/** A validação e o limite de tentativas ficam em LoginRequest. */
export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        form.post(store.url(), { onFinish: () => form.reset('password') });
    };

    return (
        <AuthLayout
            title="Entrar"
            description="Acesse seu extrato com seu e-mail e senha."
            footer={
                <>
                    Ainda não tem conta?{' '}
                    <Link href={register.url()}>Criar conta</Link>
                </>
            }
        >
            <form className="auth__form" onSubmit={submit} noValidate>
                <AuthField label="E-mail" error={form.errors.email}>
                    <input
                        className="input"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        value={form.data.email}
                        aria-invalid={!!form.errors.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                    />
                </AuthField>
                <AuthField label="Senha" error={form.errors.password}>
                    <input
                        className="input"
                        type="password"
                        autoComplete="current-password"
                        value={form.data.password}
                        aria-invalid={!!form.errors.password}
                        onChange={(e) =>
                            form.setData('password', e.target.value)
                        }
                    />
                </AuthField>
                <label className="check">
                    <input
                        type="checkbox"
                        checked={form.data.remember}
                        onChange={(e) =>
                            form.setData('remember', e.target.checked)
                        }
                    />
                    Manter conectado
                </label>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={form.processing}
                >
                    {form.processing ? 'Entrando…' : 'Entrar'}
                </button>
            </form>
        </AuthLayout>
    );
}

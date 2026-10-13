import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import FingertipLogo from '@/components/fingertip-logo';

type Props = {
    title: string;
    description: string;
    children: ReactNode;
    footer: ReactNode;
};

/** Moldura das telas "Entrar" e "Criar conta". */
export default function AuthLayout({
    title,
    description,
    children,
    footer,
}: Props) {
    return (
        <>
            <Head title={title} />
            <main className="auth">
                <div className="auth__box">
                    <FingertipLogo size={40} className="auth__logo" />
                    <div className="card form">
                        <h2>{title}</h2>
                        <p className="muted small">{description}</p>
                        {children}
                    </div>
                    <p className="auth__foot muted small">{footer}</p>
                </div>
            </main>
        </>
    );
}

type FieldProps = {
    label: string;
    error?: string;
    children: ReactNode;
};

/** Campo com rótulo e mensagem de erro vinda do servidor. */
export function AuthField({ label, error, children }: FieldProps) {
    return (
        <label className="field">
            <span>{label}</span>
            {children}
            {error && (
                <small role="alert" className="field__error">
                    {error}
                </small>
            )}
        </label>
    );
}

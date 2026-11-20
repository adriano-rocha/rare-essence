'use client';

import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);

    const formulario = new FormData(evento.currentTarget);
    try {
      const resposta = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formulario.get('email'),
          senha: formulario.get('senha'),
        }),
      });

      if (!resposta.ok) {
        setErro(
          resposta.status === 429
            ? 'Muitas tentativas. Aguarde antes de tentar novamente.'
            : resposta.status === 503
              ? 'O acesso administrativo está temporariamente indisponível.'
              : 'E-mail ou senha inválidos.'
        );
        return;
      }

      window.location.assign('/admin');
    } catch {
      setErro('Não foi possível conectar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg border border-brand-border bg-brand-surface p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
          Rare Essence
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-brand-text">
          Acesso administrativo
        </h1>
        <form className="mt-6 space-y-4" onSubmit={entrar}>
          <label className="block text-sm text-brand-muted">
            E-mail
            <input
              autoComplete="username"
              className="mt-1 w-full rounded border border-brand-border bg-brand-bg p-3 text-brand-text outline-none focus:border-brand-accent"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="block text-sm text-brand-muted">
            Senha
            <div className="relative mt-1">
              <input
                autoComplete="current-password"
                className="w-full rounded border border-brand-border bg-brand-bg p-3 pr-11 text-brand-text outline-none focus:border-brand-accent"
                name="senha"
                required
                type={mostrarSenha ? 'text' : 'password'}
              />
              <button
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Visualizar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition hover:text-brand-text"
                onClick={() => setMostrarSenha((atual) => !atual)}
                type="button"
              >
                {mostrarSenha ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
              </button>
            </div>
          </label>
          {erro && (
            <p aria-live="polite" className="text-sm text-red-400" role="alert">
              {erro}
            </p>
          )}
          <button
            className="w-full rounded bg-brand-accent px-4 py-3 font-semibold text-brand-bg transition hover:bg-brand-gold disabled:opacity-60"
            disabled={carregando}
            type="submit"
          >
            {carregando ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
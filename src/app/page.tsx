export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-lg border border-brand-border bg-brand-surface p-8 shadow-2xl">
        <span className="text-xs uppercase tracking-widest text-brand-accent font-semibold">
          Haute Parfumerie
        </span>
        <h1 className="mt-2 text-3xl font-serif font-bold text-brand-text">
          Rare Essence
        </h1>
        <p className="mt-4 text-sm text-brand-muted">
          Fundação arquitetural ativa. Ambiente configurado sob Clean Architecture e SDD.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-border px-3 py-1 text-xs text-brand-pix">
          <span className="h-2 w-2 rounded-full bg-brand-pix animate-pulse" />
          Fase 0 — Fundação em Execução
        </div>
      </div>
    </main>
  );
}
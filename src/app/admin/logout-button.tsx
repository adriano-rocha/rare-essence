'use client';

export function AdminLogoutButton() {
  async function sair() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.assign('/admin/login');
  }

  return (
    <button
      className="rounded border border-brand-border px-4 py-2 text-sm text-brand-text"
      onClick={sair}
      type="button"
    >
      Sair
    </button>
  );
}

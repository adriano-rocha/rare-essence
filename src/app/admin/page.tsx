'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLogoutButton } from './logout-button';

interface PedidoLista {
  id: string;
  codigoRastreavel: string;
  status: string;
  formaPagamento: string;
  clienteNome: string;
  clienteEmail: string;
  totalEmCentavos: number;
  criadoEm: string;
  _count: { itens: number };
}

interface PedidoDetalhe extends PedidoLista {
  cliente: { nome: string; email: string; cpf: string; telefone: string };
  enderecoEntrega: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  };
  itens: {
    variacaoId: string;
    sku: string;
    nomeProduto: string;
    volumeMl: number;
    quantidade: number;
    precoUnitarioCentavos: number;
    subtotalCentavos: number;
  }[];
  frete: { modalidade: string; prazoDias: number; valorCentavos: number };
  subtotalProdutosCentavos: number;
  descontoCupomCentavos: number;
  descontoPixCentavos: number;
  atualizadoEm: string;
}

function dinheiro(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

function labelStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

export default function AdminPage() {
  const [pedidos, setPedidos] = useState<PedidoLista[]>([]);
  const [selecionado, setSelecionado] = useState<PedidoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  const carregarPedidos = useCallback(async () => {
    setErro('');
    try {
      const resposta = await fetch('/api/admin/pedidos', { cache: 'no-store' });
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo.mensagem ?? 'Falha ao carregar pedidos.');
      setPedidos(corpo.pedidos);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao carregar pedidos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarPedidos();
  }, [carregarPedidos]);

  async function abrirPedido(pedidoId: string) {
    setErro('');
    try {
      const resposta = await fetch(`/api/admin/pedidos/${pedidoId}`, { cache: 'no-store' });
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo.mensagem ?? 'Falha ao abrir pedido.');
      setSelecionado(corpo);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao abrir pedido.');
    }
  }

  async function atualizarStatus(status: 'EM_SEPARACAO' | 'ENVIADO' | 'ENTREGUE') {
    if (!selecionado) return;
    setErro('');
    setAtualizando(true);
    try {
      const resposta = await fetch(`/api/admin/pedidos/${selecionado.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const corpo = await resposta.json();
      if (!resposta.ok) throw new Error(corpo.mensagem ?? 'Transição de status inválida.');
      await Promise.all([carregarPedidos(), abrirPedido(selecionado.id)]);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível atualizar o pedido.');
    } finally {
      setAtualizando(false);
    }
  }

  const proximoStatus: Record<string, 'EM_SEPARACAO' | 'ENVIADO' | 'ENTREGUE' | undefined> = {
    PAGO: 'EM_SEPARACAO',
    EM_SEPARACAO: 'ENVIADO',
    ENVIADO: 'ENTREGUE',
  };

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-brand-border pb-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-accent">Rare Essence · Administração</p>
            <h1 className="mt-2 font-serif text-3xl text-brand-text">Pedidos</h1>
            <p className="mt-2 text-xs text-brand-muted">Acompanhe pedidos e avance as etapas de envio.</p>
          </div>
          <AdminLogoutButton />
        </header>

        {erro && <p className="mt-5 border border-red-900 bg-red-950/40 p-3 text-sm text-red-200" role="alert">{erro}</p>}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section aria-label="Lista de pedidos">
            {carregando ? (
              <p className="py-8 text-sm text-brand-muted">Carregando pedidos...</p>
            ) : pedidos.length === 0 ? (
              <div className="border border-brand-border bg-brand-surface p-8">
                <p className="font-serif text-xl text-brand-text">Nenhum pedido ainda</p>
                <p className="mt-2 text-sm text-brand-muted">Os novos pedidos aparecerão nesta lista.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-brand-border">
                <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                  <thead className="bg-brand-surface text-[9px] uppercase tracking-[0.16em] text-brand-muted">
                    <tr><th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr className={`cursor-pointer border-t border-brand-border transition hover:bg-brand-surface/70 ${selecionado?.id === pedido.id ? 'bg-brand-surface' : ''}`} key={pedido.id} onClick={() => void abrirPedido(pedido.id)}>
                        <td className="px-4 py-4">
                          <span className="block font-semibold text-brand-text">{pedido.codigoRastreavel}</span>
                          <span className="mt-1 block text-[10px] text-brand-muted">{new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}</span>
                        </td>
                        <td className="px-4 py-4 text-brand-text">{pedido.clienteNome}</td>
                        <td className="px-4 py-4"><span className="border border-brand-border px-2 py-1 text-[9px] uppercase tracking-wider text-brand-accent">{labelStatus(pedido.status)}</span></td>
                        <td className="px-4 py-4 text-right text-brand-text">{dinheiro(pedido.totalEmCentavos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-label="Detalhes do pedido">
            {!selecionado ? (
              <div className="border border-dashed border-brand-border p-8 text-sm text-brand-muted">Selecione um pedido para ver os detalhes.</div>
            ) : (
              <div className="border border-brand-border bg-brand-surface/50 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-brand-accent">Detalhe do pedido</p>
                    <h2 className="mt-2 font-serif text-xl text-brand-text">{selecionado.codigoRastreavel}</h2>
                  </div>
                  <span className="border border-brand-border px-2 py-1 text-[9px] uppercase tracking-wider text-brand-accent">{labelStatus(selecionado.status)}</span>
                </div>
                <div className="mt-6 border-y border-brand-border py-4 text-xs leading-6">
                  <p className="font-semibold text-brand-text">{selecionado.cliente.nome}</p>
                  <p className="text-brand-muted">{selecionado.cliente.email} · {selecionado.cliente.telefone}</p>
                  <p className="mt-2 text-brand-muted">{selecionado.enderecoEntrega.logradouro}, {selecionado.enderecoEntrega.numero}{selecionado.enderecoEntrega.complemento ? `, ${selecionado.enderecoEntrega.complemento}` : ''}</p>
                  <p className="text-brand-muted">{selecionado.enderecoEntrega.bairro}, {selecionado.enderecoEntrega.cidade} - {selecionado.enderecoEntrega.estado}, {selecionado.enderecoEntrega.cep}</p>
                </div>
                <div className="mt-4 space-y-3">
                  {selecionado.itens.map((item) => (
                    <div className="flex justify-between gap-3 text-xs" key={item.variacaoId}>
                      <div><p className="text-brand-text">{item.nomeProduto} · {item.volumeMl} ml</p><p className="mt-1 text-[10px] text-brand-muted">{item.quantidade} × {dinheiro(item.precoUnitarioCentavos)}</p></div>
                      <p className="text-brand-text">{dinheiro(item.subtotalCentavos)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 space-y-2 border-t border-brand-border pt-4 text-xs">
                  <div className="flex justify-between text-brand-muted"><span>Frete {selecionado.frete.modalidade}</span><span>{dinheiro(selecionado.frete.valorCentavos)}</span></div>
                  <div className="flex justify-between font-semibold text-brand-text"><span>Total</span><span>{dinheiro(selecionado.totalEmCentavos)}</span></div>
                </div>
                {proximoStatus[selecionado.status] && (
                  <button
                    className="mt-6 w-full bg-brand-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-bg disabled:opacity-60"
                    disabled={atualizando}
                    onClick={() => void atualizarStatus(proximoStatus[selecionado.status] as 'EM_SEPARACAO' | 'ENVIADO' | 'ENTREGUE')}
                    type="button"
                  >
                    {atualizando ? 'Atualizando...' : `Avançar para ${labelStatus(proximoStatus[selecionado.status] ?? '')}`}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

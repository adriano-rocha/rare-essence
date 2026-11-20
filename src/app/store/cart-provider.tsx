'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  createContext,
  FormEvent,
  MouseEvent,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Mail, MapPin, Pause, Play } from 'lucide-react';
import { z } from 'zod';
import type { CotacaoCheckout } from '@/modules/carrinho/application/checkout-dto';

// TODO: substituir pelos dados reais da Rare Essence antes da virada para produção
const CONTATO_LOJA = {
  endereco: 'Rua Oscar Freire, 1000 · Jardins',
  cidadeUf: 'São Paulo — SP · Brasil',
  horario: 'Atendimento: Seg a Sex, 9h às 18h',
  email: 'contato@rareessence.com.br',
  instagramHandle: '@rareessence.parfums',
  instagramUrl: 'https://instagram.com/rareessence.parfums',
  whatsappNumero: '5511999999999',
  whatsappExibicao: '(11) 99999-9999',
  whatsappMensagem: 'Olá! Gostaria de um atendimento personalizado na Rare Essence.',
} as const;

const mensagensBeneficios = [
  '5% de desconto no Pix',
  'Até 6x sem juros no cartão',
  'Frete grátis no PAC em compras a partir de R$ 350',
];

export interface CartLine {
  variacaoId: string;
  sku: string;
  nomeProduto: string;
  slug: string;
  imagemUrl?: string | null;
  volumeMl: number;
  precoCentavos: number;
  estoqueDisponivel: number;
  quantidade: number;
}

const carrinhoSchema = z.array(
  z.object({
    variacaoId: z.string().min(1),
    sku: z.string().min(1),
    nomeProduto: z.string().min(1),
    slug: z.string().min(1),
    imagemUrl: z.string().nullable().optional(),
    volumeMl: z.number().int().positive(),
    precoCentavos: z.number().int().nonnegative(),
    estoqueDisponivel: z.number().int().nonnegative(),
    quantidade: z.number().int().positive().max(10),
  })
);

interface CartContextValue {
  itens: CartLine[];
  quantidadeItens: number;
  aberto: boolean;
  adicionar: (item: Omit<CartLine, 'quantidade'>) => void;
  alterarQuantidade: (variacaoId: string, quantidade: number) => void;
  remover: (variacaoId: string) => void;
  limpar: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

function formatarCep(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

function formatarCpf(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

function formatarTelefone(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function cpfValido(valor: string): boolean {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(cpf[10]);
}

function AnnouncementBar() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const timer = window.setInterval(() => {
      setIndice((atual) => (atual + 1) % mensagensBeneficios.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [pausado]);

  function navegar(direcao: -1 | 1) {
    setIndice((atual) =>
      (atual + direcao + mensagensBeneficios.length) % mensagensBeneficios.length
    );
  }

  return (
    <div className="flex min-h-10 items-center justify-center gap-3 bg-brand-accent px-3 text-brand-bg">
      <button
        aria-label="Benefício anterior"
        className="p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-bg"
        onClick={() => navegar(-1)}
        type="button"
      >
        <ChevronLeft aria-hidden size={16} />
      </button>
      <p aria-live="off" className="min-w-0 text-center text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-xs">
        {mensagensBeneficios[indice]}
      </p>
      <button
        aria-label="Próximo benefício"
        className="p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-bg"
        onClick={() => navegar(1)}
        type="button"
      >
        <ChevronRight aria-hidden size={16} />
      </button>
      <button
        aria-label={pausado ? 'Retomar benefícios rotativos' : 'Pausar benefícios rotativos'}
        className="p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-bg"
        onClick={() => setPausado((atual) => !atual)}
        type="button"
      >
        {pausado ? <Play aria-hidden size={14} /> : <Pause aria-hidden size={14} />}
      </button>
    </div>
  );
}

function dinheiro(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);
}

function rolarParaSecaoNaHome(
  event: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  secaoId: string,
) {
  if (pathname !== '/') return;
  const alvo = document.getElementById(secaoId);
  if (!alvo) return;
  event.preventDefault();
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  alvo.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'start' });
  window.history.replaceState(null, '', `/#${secaoId}`);
}

function StoreHeader() {
  const { quantidadeItens, openCart } = useCart();
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-30">
      <AnnouncementBar />
      <header className="border-b border-brand-border bg-brand-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link className="font-serif text-lg tracking-[0.12em] text-brand-text" href="/">
            RARE <span className="text-brand-accent">ESSENCE</span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-8 text-[10px] uppercase tracking-[0.2em] text-brand-muted sm:flex">
            <Link
              className="transition hover:text-brand-text"
              href="/#colecao"
              onClick={(event) => rolarParaSecaoNaHome(event, pathname, 'colecao')}
            >
              A coleção
            </Link>
            <Link
              className="transition hover:text-brand-text"
              href="/#pilares"
              onClick={(event) => rolarParaSecaoNaHome(event, pathname, 'pilares')}
            >
              Confiança
            </Link>
            <Link
              className="transition hover:text-brand-text"
              href="/#manifesto"
              onClick={(event) => rolarParaSecaoNaHome(event, pathname, 'manifesto')}
            >
              Manifesto
            </Link>
          </nav>
          <button
            aria-label="Abrir carrinho"
            className="inline-flex items-center gap-2 border border-brand-border px-4 py-2 text-xs uppercase tracking-widest text-brand-text transition hover:border-brand-accent"
            onClick={openCart}
            type="button"
          >
            Sacola <span className="text-brand-accent">({quantidadeItens})</span>
          </button>
        </div>
      </header>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="15">
      <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <Image
      alt=""
      aria-hidden
      className="shrink-0 object-contain"
      height={size}
      src="/whats.png"
      width={size}
    />
  );
}

function StoreFooter() {
  const pathname = usePathname();
  const whatsappUrl = `https://wa.me/${CONTATO_LOJA.whatsappNumero}?text=${encodeURIComponent(CONTATO_LOJA.whatsappMensagem)}`;

  return (
    <footer className="border-t border-brand-border bg-brand-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link className="font-serif text-xl tracking-[0.14em] text-brand-text" href="/">
              RARE <span className="text-brand-accent">ESSENCE</span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-6 text-brand-muted">
              Haute parfumerie. Uma assinatura, nunca uma repetição.
            </p>
            <div className="mt-5 flex items-start gap-2.5 text-xs text-brand-muted">
              <MapPin aria-hidden className="mt-0.5 shrink-0 text-brand-accent" size={14} />
              <div>
                <p>{CONTATO_LOJA.endereco}</p>
                <p>{CONTATO_LOJA.cidadeUf}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
              Navegação
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-brand-muted">
              <li>
                <Link
                  className="transition hover:text-brand-text"
                  href="/#colecao"
                  onClick={(event) => rolarParaSecaoNaHome(event, pathname, 'colecao')}
                >
                  A coleção
                </Link>
              </li>
              <li>
                <Link
                  className="transition hover:text-brand-text"
                  href="/#pilares"
                  onClick={(event) => rolarParaSecaoNaHome(event, pathname, 'pilares')}
                >
                  Comprar com confiança
                </Link>
              </li>
              <li>
                <Link
                  className="transition hover:text-brand-text"
                  href="/#manifesto"
                  onClick={(event) => rolarParaSecaoNaHome(event, pathname, 'manifesto')}
                >
                  O manifesto
                </Link>
              </li>
            </ul>
            <p className="mt-5 text-[11px] text-brand-muted/80">{CONTATO_LOJA.horario}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
              Canais &amp; Concierge
            </p>
            <ul className="mt-4 space-y-3 text-xs text-brand-muted">
              <li>
                <a
                  className="inline-flex items-center gap-2.5 transition hover:text-brand-text"
                  href={CONTATO_LOJA.instagramUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="text-brand-accent"><InstagramIcon /></span>
                  {CONTATO_LOJA.instagramHandle}
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2.5 transition hover:text-brand-text"
                  href={whatsappUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="text-brand-accent"><WhatsAppIcon /></span>
                  WhatsApp {CONTATO_LOJA.whatsappExibicao}
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2.5 transition hover:text-brand-text"
                  href={`mailto:${CONTATO_LOJA.email}`}
                >
                  <Mail aria-hidden className="text-brand-accent" size={14} />
                  {CONTATO_LOJA.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-border pt-6 text-[11px] text-brand-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Rare Essence. Todos os direitos reservados.</p>
          <p className="uppercase tracking-[0.14em] text-brand-muted/90">
            Pix 5% OFF · Até 6x sem juros · Envio Correios
          </p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppConcierge() {
  const whatsappUrl = `https://wa.me/${CONTATO_LOJA.whatsappNumero}?text=${encodeURIComponent(CONTATO_LOJA.whatsappMensagem)}`;

  return (
    <a
      aria-label="Falar com atendimento da Rare Essence no WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 border border-brand-accent/60 bg-brand-surface/95 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-text shadow-2xl backdrop-blur transition hover:border-brand-gold hover:bg-brand-accent hover:text-brand-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"
      href={whatsappUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <WhatsAppIcon size={20} />
      <span className="hidden sm:inline">Atendimento</span>
    </a>
  );
}

function CartDrawer() {
  const {
    itens,
    aberto,
    alterarQuantidade,
    closeCart,
    limpar,
    remover,
  } = useCart();
  const [cep, setCep] = useState('');
  const [cotacao, setCotacao] = useState<CotacaoCheckout | null>(null);
  const [frete, setFrete] = useState<'PAC' | 'SEDEX' | null>(null);
  const [etapa, setEtapa] = useState<'carrinho' | 'checkout' | 'pagamento'>('carrinho');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState('');
  const [cepBuscado, setCepBuscado] = useState('');

  const [pagamento, setPagamento] = useState<{
    pedidoId: string;
    codigoPedido: string;
    codigoPix?: string;
    qrCodeBase64?: string;
    expiraEm?: string;
  } | null>(null);

  useEffect(() => {
    if (!aberto) return;
    function fecharComEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCart();
    }
    window.addEventListener('keydown', fecharComEsc);
    return () => window.removeEventListener('keydown', fecharComEsc);
  }, [aberto, closeCart]);

  useEffect(() => {
    if (etapa !== 'checkout') return;
    const cepLimpo = apenasDigitos(cep);
    if (cepLimpo.length !== 8 || cepBuscado === cepLimpo) return;

    let cancelado = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    async function buscarEnderecoPorCep() {
      setBuscandoCep(true);
      setAvisoCep('');
      try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
          signal: controller.signal,
        });
        if (!resposta.ok) throw new Error('Falha ViaCEP');
        const dados = (await resposta.json()) as {
          erro?: boolean | string;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };
        if (cancelado) return;
        setCepBuscado(cepLimpo);
        if (dados.erro) {
          setAvisoCep('CEP não localizado automaticamente. Preencha o endereço abaixo.');
          return;
        }
        if (dados.logradouro) setLogradouro(dados.logradouro);
        if (dados.bairro) setBairro(dados.bairro);
        if (dados.localidade) setCidade(dados.localidade);
        if (dados.uf) setEstado(dados.uf.toUpperCase().slice(0, 2));
        setAvisoCep(
          dados.logradouro
            ? 'Endereço preenchido automaticamente pelo CEP.'
            : 'CEP único localizado. Complete rua e bairro abaixo.'
        );
      } catch {
        if (cancelado) return;
        setAvisoCep('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelado) setBuscandoCep(false);
      }
    }

    buscarEnderecoPorCep();

    return () => {
      cancelado = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [cep, cepBuscado, etapa]);

  if (!aberto) return null;

  const cpfDigitos = apenasDigitos(cpf);
  const cpfInvalidoVisivel = cpfDigitos.length === 11 && !cpfValido(cpf);

  async function cotar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setCarregando(true);
    setFrete(null);
    try {
      const resposta = await fetch('/api/checkout/cotacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cepDestino: cep,
          itens: itens.map(({ variacaoId, quantidade }) => ({ variacaoId, quantidade })),
        }),
      });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        setErro(corpo.mensagem ?? 'Não foi possível cotar o frete.');
        return;
      }
      setCotacao(corpo as CotacaoCheckout);
    } catch {
      setErro('Não foi possível conectar para cotar o frete.');
    } finally {
      setCarregando(false);
    }
  }

  async function finalizar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!frete) return;

    if (!cpfValido(cpf)) {
      setErro('Informe um CPF válido antes de finalizar o pedido.');
      return;
    }

    const telefoneDigitos = apenasDigitos(telefone);
    if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) {
      setErro('Informe um telefone válido com DDD.');
      return;
    }

    setErro('');
    setCarregando(true);
    const form = new FormData(event.currentTarget);
    try {
      const resposta = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nome: form.get('nome'),
            email: form.get('email'),
            cpf,
            telefone,
          },
          enderecoEntrega: {
            cep,
            logradouro,
            numero: form.get('numero'),
            complemento: form.get('complemento'),
            bairro,
            cidade,
            estado,
          },
          itens: itens.map(({ variacaoId, quantidade }) => ({ variacaoId, quantidade })),
          freteModalidade: frete,
          formaPagamento: 'PIX',
        }),
      });
      const pedido = await resposta.json();
      if (!resposta.ok) {
        setErro(pedido.mensagem ?? 'Não foi possível criar o pedido.');
        return;
      }

      setPagamento({
        pedidoId: pedido.pedidoId,
        codigoPedido: pedido.codigoRastreavel,
      });
      setEtapa('pagamento');
      limpar();

      const pagamentoResponse = await fetch(`/api/pagamentos/${pedido.pedidoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formaPagamento: 'PIX' }),
      });
      const pagamentoBody = await pagamentoResponse.json();
      if (!pagamentoResponse.ok) {
        setErro(
          `Pedido ${pedido.codigoRastreavel} criado, mas não foi possível gerar o Pix. O pedido permanece disponível para nova tentativa.`
        );
        setPagamento({
          pedidoId: pedido.pedidoId,
          codigoPedido: pedido.codigoRastreavel,
        });
        return;
      }

      setPagamento({
        pedidoId: pedido.pedidoId,
        codigoPedido: pedido.codigoRastreavel,
        codigoPix: pagamentoBody.codigoPix,
        qrCodeBase64: pagamentoBody.qrCodeBase64,
        expiraEm: pagamentoBody.expiraEm,
      });
    } catch {
      setErro('Não foi possível concluir o checkout. Verifique a conexão e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function tentarNovamentePagamento() {
    if (!pagamento) return;
    setErro('');
    setCarregando(true);
    try {
      const resposta = await fetch(`/api/pagamentos/${pagamento.pedidoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formaPagamento: 'PIX' }),
      });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        setErro(corpo.mensagem ?? 'Não foi possível gerar o Pix.');
        return;
      }
      setPagamento({
        ...pagamento,
        codigoPix: corpo.codigoPix,
        qrCodeBase64: corpo.qrCodeBase64,
        expiraEm: corpo.expiraEm,
      });
      setErro('');
    } catch {
      setErro('Não foi possível conectar para gerar o Pix.');
    } finally {
      setCarregando(false);
    }
  }

  function invalidarCotacao() {
    setCotacao(null);
    setFrete(null);
    setEtapa('carrinho');
  }

  const opcaoFrete = cotacao?.opcoesFrete.find((opcao) => opcao.modalidade === frete);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fechar carrinho"
        className="absolute inset-0 bg-black/70"
        onClick={closeCart}
        type="button"
      />
      <aside
        aria-label="Carrinho e checkout"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-brand-border bg-brand-bg shadow-2xl"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-5">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-brand-accent">Rare Essence</p>
            <h2 className="mt-1 font-serif text-2xl text-brand-text">
              {etapa === 'pagamento' ? 'Seu pedido' : etapa === 'checkout' ? 'Finalizar pedido' : 'Sua sacola'}
            </h2>
          </div>
          <button aria-label="Fechar" className="p-2 text-xl text-brand-muted hover:text-brand-text" onClick={closeCart} type="button">×</button>
        </div>
        {erro && <p className="mx-6 mt-4 border border-red-900 bg-red-950/40 p-3 text-xs leading-5 text-red-200" role="alert">{erro}</p>}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {etapa === 'pagamento' && pagamento ? (
            <div className="space-y-5">
              <p className="text-sm text-brand-muted">Pedido <span className="font-semibold text-brand-text">{pagamento.codigoPedido}</span></p>
              {pagamento.qrCodeBase64 ? (
                <img alt="QR Code para pagamento Pix" className="mx-auto w-52 border border-brand-border bg-white p-3" src={`data:image/png;base64,${pagamento.qrCodeBase64}`} />
              ) : (
                <div className="border border-brand-border bg-brand-surface p-5 text-sm text-brand-muted">
                  A geração do Pix depende da configuração da conta sandbox do Mercado Pago.
                </div>
              )}
              {pagamento.codigoPix && (
                <div>
                  <label className="text-xs text-brand-muted" htmlFor="codigo-pix">Pix copia e cola</label>
                  <textarea className="mt-2 w-full border border-brand-border bg-brand-surface p-3 text-xs text-brand-text" id="codigo-pix" readOnly rows={4} value={pagamento.codigoPix} />
                  <button className="mt-2 border border-brand-border px-4 py-2 text-xs text-brand-text hover:border-brand-accent" onClick={() => navigator.clipboard.writeText(pagamento.codigoPix ?? '')} type="button">Copiar código Pix</button>
                </div>
              )}
              {!pagamento.codigoPix && (
                <button className="w-full bg-brand-accent px-4 py-3 text-xs font-semibold uppercase tracking-widest text-brand-bg disabled:opacity-60" disabled={carregando} onClick={tentarNovamentePagamento} type="button">
                  {carregando ? 'Solicitando...' : 'Tentar gerar Pix novamente'}
                </button>
              )}
              <p className="text-xs text-brand-muted">Pedido criado com reserva temporária de estoque. Não feche esta tela antes de copiar o código.</p>
            </div>
          ) : etapa === 'checkout' ? (
            <form className="space-y-4" onSubmit={finalizar}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs text-brand-muted">Entrega em {cep} · frete {frete}</p>
                <button
                  className="text-[11px] uppercase tracking-wider text-brand-accent transition hover:text-brand-gold"
                  onClick={() => {
                    setErro('');
                    setEtapa('carrinho');
                  }}
                  type="button"
                >
                  ← Alterar CEP ou entrega
                </button>
              </div>
              <label className="block text-xs text-brand-muted">Nome completo<input autoComplete="name" className="form-field" maxLength={100} minLength={2} name="nome" required /></label>
              <label className="block text-xs text-brand-muted">E-mail<input autoComplete="email" className="form-field" name="email" required type="email" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-brand-muted">
                  CPF
                  <input
                    aria-invalid={cpfInvalidoVisivel}
                    className={`form-field ${cpfInvalidoVisivel ? 'border-red-500/80 focus:border-red-400' : ''}`}
                    inputMode="numeric"
                    maxLength={14}
                    name="cpf"
                    onChange={(event) => {
                      setCpf(formatarCpf(event.target.value));
                      if (erro) setErro('');
                    }}
                    placeholder="000.000.000-00"
                    required
                    value={cpf}
                  />
                  {cpfInvalidoVisivel && (
                    <span className="mt-1 block text-[11px] text-red-300">
                      CPF inválido. Verifique os dígitos.
                    </span>
                  )}
                </label>
                <label className="block text-xs text-brand-muted">
                  Telefone
                  <input
                    autoComplete="tel"
                    className="form-field"
                    inputMode="tel"
                    maxLength={15}
                    name="telefone"
                    onChange={(event) => {
                      setTelefone(formatarTelefone(event.target.value));
                      if (erro) setErro('');
                    }}
                    placeholder="(11) 99999-9999"
                    required
                    value={telefone}
                  />
                </label>
              </div>
              {(buscandoCep || avisoCep) && (
                <p className="text-[11px] text-brand-accent" role="status">
                  {buscandoCep ? 'Buscando endereço pelo CEP...' : avisoCep}
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-[1fr_0.55fr]">
                <label className="block text-xs text-brand-muted">
                  Rua / avenida
                  <input
                    autoComplete="address-line1"
                    className="form-field"
                    maxLength={120}
                    name="logradouro"
                    onChange={(event) => setLogradouro(event.target.value)}
                    required
                    value={logradouro}
                  />
                </label>
                <label className="block text-xs text-brand-muted">
                  Número
                  <input className="form-field" maxLength={20} name="numero" required />
                </label>
              </div>
              <label className="block text-xs text-brand-muted">Complemento (opcional)<input className="form-field" maxLength={100} name="complemento" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-brand-muted">
                  Bairro
                  <input
                    autoComplete="address-level3"
                    className="form-field"
                    maxLength={100}
                    name="bairro"
                    onChange={(event) => setBairro(event.target.value)}
                    required
                    value={bairro}
                  />
                </label>
                <label className="block text-xs text-brand-muted">
                  Cidade
                  <input
                    autoComplete="address-level2"
                    className="form-field"
                    maxLength={100}
                    name="cidade"
                    onChange={(event) => setCidade(event.target.value)}
                    required
                    value={cidade}
                  />
                </label>
              </div>
              <label className="block text-xs text-brand-muted">
                Estado (UF)
                <input
                  autoComplete="address-level1"
                  className="form-field uppercase"
                  maxLength={2}
                  minLength={2}
                  name="estado"
                  onChange={(event) =>
                    setEstado(event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))
                  }
                  placeholder="SP"
                  required
                  value={estado}
                />
              </label>
              <div className="border-t border-brand-border pt-4">
                {opcaoFrete && (
                  <>
                    <div className="flex justify-between text-xs text-brand-muted"><span>Frete {opcaoFrete.modalidade}</span><span>{dinheiro(opcaoFrete.valorCentavos)}</span></div>
                    <div className="mt-2 flex justify-between text-sm font-semibold text-brand-text"><span>Total no Pix</span><span>{dinheiro(opcaoFrete.totalPixCentavos)}</span></div>
                  </>
                )}
              </div>
              <button className="w-full bg-brand-accent px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-bg transition hover:bg-brand-gold disabled:opacity-60" disabled={carregando || !frete || cpfInvalidoVisivel} type="submit">
                {carregando ? 'Criando pedido...' : 'Criar pedido e gerar Pix'}
              </button>
              <p className="text-center text-[10px] text-brand-muted">Checkout seguro · pagamento processado pelo Mercado Pago</p>
            </form>
          ) : (
            <>
              {itens.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-serif text-xl text-brand-text">Sua sacola está vazia</p>
                  <Link className="mt-4 inline-block text-xs uppercase tracking-widest text-brand-accent" href="/#colecao" onClick={closeCart}>Explorar fragrâncias</Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {itens.map((item) => {
                    const cotado = cotacao?.itens.find((linha) => linha.variacaoId === item.variacaoId);
                    const precoAtual = cotado?.precoUnitarioCentavos ?? item.precoCentavos;
                    return (
                      <article className="flex gap-4 border-b border-brand-border pb-5" key={item.variacaoId}>
                        <Link
                          className={`${item.imagemUrl ? 'studio-frame p-2' : 'product-art'} relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden border border-brand-border`}
                          href={`/produto/${item.slug}`}
                          onClick={closeCart}
                        >
                          {item.imagemUrl ? (
                            <div className="relative h-full w-full">
                              <Image
                                alt={item.nomeProduto}
                                className="object-contain mix-blend-multiply"
                                fill
                                sizes="80px"
                                src={item.imagemUrl}
                              />
                            </div>
                          ) : (
                            <div aria-hidden className="bottle-card h-14 w-9 rounded-lg border border-brand-accent/30" />
                          )}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link className="font-serif text-lg text-brand-text hover:text-brand-accent" href={`/produto/${item.slug}`} onClick={closeCart}>{item.nomeProduto}</Link>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-brand-muted">{item.volumeMl} ml · {item.sku}</p>
                          <p className="mt-2 text-sm text-brand-text">{dinheiro(precoAtual)}</p>
                          {!cotado && <p className="mt-1 text-[10px] text-brand-muted">Preço confirmado após cotação.</p>}
                          <div className="mt-3 flex items-center gap-3">
                            <label className="sr-only" htmlFor={`quantidade-${item.variacaoId}`}>Quantidade</label>
                            <input
                              className="w-16 border border-brand-border bg-brand-surface px-2 py-1 text-center text-xs text-brand-text"
                              id={`quantidade-${item.variacaoId}`}
                              max={Math.min(10, item.estoqueDisponivel)}
                              min={1}
                              onChange={(event) => {
                                const quantidade = Number(event.target.value);
                                if (Number.isInteger(quantidade) && quantidade > 0) alterarQuantidade(item.variacaoId, quantidade);
                                invalidarCotacao();
                              }}
                              type="number"
                              value={item.quantidade}
                            />
                            <button className="text-[10px] uppercase tracking-wider text-brand-muted hover:text-red-300" onClick={() => { remover(item.variacaoId); invalidarCotacao(); }} type="button">Remover</button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
              {itens.length > 0 && (
                <form className="mt-7 border-t border-brand-border pt-6" onSubmit={cotar}>
                  <label className="block text-xs text-brand-muted" htmlFor="cep-cotacao">Calcule o frete pelo CEP</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="form-field mt-0"
                      id="cep-cotacao"
                      inputMode="numeric"
                      maxLength={9}
                      onChange={(event) => {
                        setCep(formatarCep(event.target.value));
                        setCotacao(null);
                        setFrete(null);
                        setCepBuscado('');
                        setAvisoCep('');
                        setLogradouro('');
                        setBairro('');
                        setCidade('');
                        setEstado('');
                      }}
                      placeholder="00000-000"
                      required
                      value={cep}
                    />
                    <button className="shrink-0 border border-brand-accent px-4 text-xs uppercase tracking-widest text-brand-text disabled:opacity-60" disabled={carregando} type="submit">{carregando ? '...' : 'Calcular'}</button>
                  </div>
                </form>
              )}
              {cotacao && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-brand-muted">Escolha a entrega</p>
                  {cotacao.opcoesFrete.map((opcao) => (
                    <button
                      aria-pressed={frete === opcao.modalidade}
                      className={`flex w-full items-center justify-between border p-4 text-left transition ${frete === opcao.modalidade ? 'border-brand-accent bg-brand-surface' : 'border-brand-border hover:border-brand-accent/60'}`}
                      key={opcao.modalidade}
                      onClick={() => setFrete(opcao.modalidade)}
                      type="button"
                    >
                      <span>
                        <span className="block text-sm text-brand-text">{opcao.modalidade} · até {opcao.prazoDias} dias úteis</span>
                        <span className="mt-1 block text-[10px] text-brand-muted">{opcao.freteGratis ? 'Frete grátis' : dinheiro(opcao.valorCentavos)}</span>
                      </span>
                      <span className="text-sm font-semibold text-brand-pix">{dinheiro(opcao.totalPixCentavos)} no Pix</span>
                    </button>
                  ))}
                  {frete && (
                    <button className="mt-3 w-full bg-brand-accent px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-bg transition hover:bg-brand-gold" onClick={() => setEtapa('checkout')} type="button">
                      Continuar para checkout
                    </button>
                  )}
                  <p className="text-center text-[10px] text-brand-muted">Total calculado no servidor · parcelas e Pix atualizados para os itens selecionados</p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<CartLine[]>([]);
  const [aberto, setAberto] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    const salvo = localStorage.getItem('rare-essence-cart');
    if (!salvo) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = carrinhoSchema.safeParse(JSON.parse(salvo));
      if (parsed.success) setItens(parsed.data);
      else localStorage.removeItem('rare-essence-cart');
    } catch {
      localStorage.removeItem('rare-essence-cart');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('rare-essence-cart', JSON.stringify(itens));
  }, [hydrated, itens]);

  const value = useMemo<CartContextValue>(() => ({
    itens,
    quantidadeItens: itens.reduce((total, item) => total + item.quantidade, 0),
    aberto,
    adicionar(item) {
      setItens((atuais) => {
        const existente = atuais.find((linha) => linha.variacaoId === item.variacaoId);
        if (existente) {
          return atuais.map((linha) =>
            linha.variacaoId === item.variacaoId
              ? { ...linha, quantidade: Math.min(10, item.estoqueDisponivel, linha.quantidade + 1) }
              : linha
          );
        }
        return [...atuais, { ...item, quantidade: 1 }];
      });
      setAberto(true);
    },
    alterarQuantidade(variacaoId, quantidade) {
      setItens((atuais) => atuais.map((linha) =>
        linha.variacaoId === variacaoId
          ? { ...linha, quantidade: Math.min(10, linha.estoqueDisponivel, quantidade) }
          : linha
      ));
    },
    remover(variacaoId) {
      setItens((atuais) => atuais.filter((linha) => linha.variacaoId !== variacaoId));
    },
    limpar() {
      setItens([]);
    },
    openCart() {
      setAberto(true);
    },
    closeCart() {
      setAberto(false);
    },
  }), [aberto, itens]);

  return (
    <CartContext.Provider value={value}>
      {!isAdmin && <StoreHeader />}
      {children}
      {!isAdmin && <StoreFooter />}
      {!isAdmin && !aberto && <WhatsAppConcierge />}
      {!isAdmin && <CartDrawer />}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error('useCart deve ser usado dentro de CartProvider.');
  return contexto;
}
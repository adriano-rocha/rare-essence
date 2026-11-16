import { FamiliaOlfativa, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function validarBancoDeDemonstracao(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL é obrigatório para executar o seed de demonstração.');
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL inválido; seed de demonstração cancelado.');
  }

  const database = url.pathname.replace(/^\//, '');
  const hostsLocais = ['localhost', '127.0.0.1', '[::1]'];
  if (!hostsLocais.includes(url.hostname) || database !== 'rare_essence_demo') {
    throw new Error(
      'O seed destrutivo só pode ser executado no banco local rare_essence_demo.'
    );
  }
}

async function main() {
  validarBancoDeDemonstracao();
  console.log('🌱 Iniciando Seed do Catálogo Rare Essence (Noir & Âmbar)...');

  // Limpeza de tabelas para seed idempotente
  await prisma.variacao.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.marca.deleteMany();
  await prisma.categoria.deleteMany();

  // 1. Marcas fictícias do catálogo de demonstração
  const marcas = [
    { id: 'marca-maison-dor', nome: "Maison D'or", slug: 'maison-dor' },
    { id: 'marca-forncedro', nome: 'Forncedro', slug: 'forncedro' },
    { id: 'marca-vorine', nome: 'VORINÉ', slug: 'vorine' },
    { id: 'marca-vetigey', nome: 'VETIGEY', slug: 'vetigey' },
    { id: 'marca-mandry', nome: 'MANDRY', slug: 'mandry' },
    { id: 'marca-rayhaan', nome: 'RAYHAAN', slug: 'rayhaan' },
    { id: 'marca-imperial', nome: 'Imperial Parfums', slug: 'imperial-parfums' },
    { id: 'marca-rare', nome: 'Rare Essence Parfums', slug: 'rare-essence' },
  ];
  const marcaIds = new Map<string, string>();
  for (const marca of marcas) {
    const criada = await prisma.marca.create({ data: marca });
    marcaIds.set(marca.slug, criada.id);
  }

  // 2. Categorias do catálogo de demonstração
  const categorias = await Promise.all([
    prisma.categoria.create({ data: { id: 'cat-amadeirado', nome: 'Amadeirado Nobre', slug: 'amadeirado-nobre' } }),
    prisma.categoria.create({ data: { id: 'cat-oriental', nome: 'Oriental Especiado', slug: 'oriental-especiado' } }),
    prisma.categoria.create({ data: { id: 'cat-ambarado', nome: 'Âmbar & Resinas', slug: 'ambar-resinas' } }),
    prisma.categoria.create({ data: { id: 'cat-couro', nome: 'Couro Imperial', slug: 'couro-imperial' } }),
    prisma.categoria.create({ data: { id: 'cat-citrico', nome: 'Cítrico Luminoso', slug: 'citrico-luminoso' } }),
  ]);

  const [catAmadeirado, catOriental, catAmbar, catCouro, catCitrico] = categorias;

  // 3. Doze fragrâncias fictícias para testar a loja e as quatro famílias.
  const perfumes = [
    {
      id: 'prod-01',
      nome: 'ÉLÉGANCE ROYALE',
      slug: 'elegance-royale',
      marcaSlug: 'maison-dor',
      imagemUrl: '/elegance.png',
      descricao: 'Uma criação luminosa de bergamota e açafrão que revela um coração de rosa aveludada e íris, repousando sobre âmbar dourado e madeiras nobres.',
      categoriaId: catAmbar.id,
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Bergamota', 'Açafrão'],
      notasCoracao: ['Rosa Aveludada', 'Íris'],
      notasBase: ['Âmbar Dourado', 'Madeiras Nobres'],
      variacoes: [
        { id: 'var-01-50', sku: 'RARE-ELEGANCE-50ML', volumeMl: 50, precoCentavos: 42000 },
        { id: 'var-01-100', sku: 'RARE-ELEGANCE-100ML', volumeMl: 100, precoCentavos: 68000 },
      ],
    },
    {
      id: 'prod-02',
      nome: 'VULTRIX',
      slug: 'vultrix',
      marcaSlug: 'forncedro',
      imagemUrl: '/vultrix.png',
      descricao: 'Uma fragrância de presença intensa: pimenta negra e cardamomo abrem caminho para cedro seco, couro macio e um rastro profundo de âmbar e vetiver.',
      categoriaId: catAmbar.id,
      familiaOlfativa: FamiliaOlfativa.AMADEIRADO,
      notasTopo: ['Pimenta Negra', 'Cardamomo'],
      notasCoracao: ['Cedro Seco', 'Couro Macio'],
      notasBase: ['Âmbar', 'Vetiver'],
      variacoes: [
        { id: 'var-02-50', sku: 'RARE-VULTRIX-50ML', volumeMl: 50, precoCentavos: 39000 },
        { id: 'var-02-100', sku: 'RARE-VULTRIX-100ML', volumeMl: 100, precoCentavos: 63000 },
      ],
    },
    {
      id: 'prod-03',
      nome: 'AMARÉNO',
      slug: 'amareno',
      marcaSlug: 'vorine',
      imagemUrl: '/amareno.png',
      descricao: 'Eau de Parfum que combina mandarina madura e frutas douradas com um coração floral delicado; baunilha cremosa e sândalo deixam uma assinatura envolvente.',
      categoriaId: catCitrico.id,
      familiaOlfativa: FamiliaOlfativa.CITRICO,
      notasTopo: ['Mandarina', 'Frutas Douradas'],
      notasCoracao: ['Jasmim', 'Flor de Laranjeira'],
      notasBase: ['Baunilha', 'Sândalo'],
      variacoes: [
        { id: 'var-03-50', sku: 'RARE-AMARENO-50ML', volumeMl: 50, precoCentavos: 48000 },
        { id: 'var-03-100', sku: 'RARE-AMARENO-100ML', volumeMl: 100, precoCentavos: 79000 },
      ],
    },
    {
      id: 'prod-04',
      nome: 'PURE AMAZON',
      slug: 'pure-amazon',
      marcaSlug: 'vetigey',
      imagemUrl: '/amazon.png',
      descricao: 'Uma viagem verde pela floresta: folhas úmidas e cítricos frescos encontram ervas aromáticas e madeiras limpas, com um fundo mineral que evoca a chuva sobre a mata.',
      categoriaId: catCitrico.id,
      familiaOlfativa: FamiliaOlfativa.CITRICO,
      notasTopo: ['Lima', 'Folhas Verdes'],
      notasCoracao: ['Ervas Aromáticas', 'Chá Branco'],
      notasBase: ['Madeira Úmida', 'Acorde Mineral'],
      variacoes: [
        { id: 'var-04-50', sku: 'RARE-PURE-AMAZON-50ML', volumeMl: 50, precoCentavos: 44000 },
        { id: 'var-04-100', sku: 'RARE-PURE-AMAZON-100ML', volumeMl: 100, precoCentavos: 71000 },
      ],
    },
    {
      id: 'prod-05',
      nome: 'CUIR MAJESTUEUX',
      slug: 'cuir-majestueux',
      marcaSlug: 'vorine',
      imagemUrl: '/cuir.png',
      descricao: 'Eau de Parfum de couro elegante e especiado, com zimbro e pimenta rosa na abertura, tabaco no coração e cedro envolto em vetiver na base.',
      categoriaId: catCouro.id,
      familiaOlfativa: FamiliaOlfativa.ESPECIADO,
      notasTopo: ['Zimbro', 'Pimenta Rosa'],
      notasCoracao: ['Folha de Tabaco', 'Sálvia Esclaréia'],
      notasBase: ['Couro da Toscana', 'Vetiver de Bourbon', 'Cedro da Virgínia'],
      variacoes: [
        { id: 'var-05-50', sku: 'RARE-CUIR-50ML', volumeMl: 50, precoCentavos: 44000 },
        { id: 'var-05-100', sku: 'RARE-CUIR-100ML', volumeMl: 100, precoCentavos: 71000 },
      ],
    },
    {
      id: 'prod-06',
      nome: 'VELOURS CITRON RARE',
      slug: 'velours-citron-rare',
      marcaSlug: 'mandry',
      imagemUrl: '/velours.png',
      descricao: 'Um cítrico macio e sofisticado: limão siciliano e bergamota brilham sobre neroli e chá branco, enquanto almíscar e cedro claro prolongam a sensação de frescor.',
      categoriaId: catCitrico.id,
      familiaOlfativa: FamiliaOlfativa.CITRICO,
      notasTopo: ['Limão Siciliano', 'Bergamota'],
      notasCoracao: ['Neroli', 'Chá Branco'],
      notasBase: ['Almíscar', 'Cedro Claro'],
      variacoes: [
        { id: 'var-06-50', sku: 'RARE-VELOURS-50ML', volumeMl: 50, precoCentavos: 41000 },
        { id: 'var-06-100', sku: 'RARE-VELOURS-100ML', volumeMl: 100, precoCentavos: 66000 },
      ],
    },
    {
      id: 'prod-07',
      nome: 'FORNCEDRO',
      slug: 'forncedro',
      marcaSlug: 'forncedro',
      imagemUrl: '/forncedro.png',
      descricao: 'Eau de Parfum amadeirada que une cedro aromático a especiarias quentes e lavanda; fava tonka e âmbar suavizam o conjunto com um rastro confortável.',
      categoriaId: catAmadeirado.id,
      familiaOlfativa: FamiliaOlfativa.AMADEIRADO,
      notasTopo: ['Lavanda', 'Pimenta Rosa'],
      notasCoracao: ['Cedro', 'Noz-moscada'],
      notasBase: ['Fava Tonka', 'Âmbar'],
      variacoes: [
        { id: 'var-07-50', sku: 'RARE-FORNCEDRO-50ML', volumeMl: 50, precoCentavos: 43000 },
        { id: 'var-07-100', sku: 'RARE-FORNCEDRO-100ML', volumeMl: 100, precoCentavos: 69000 },
      ],
    },
    {
      id: 'prod-08',
      nome: 'SABLE ÉTERNEL',
      slug: 'sable-eternel',
      marcaSlug: 'rayhaan',
      imagemUrl: '/sable.png',
      descricao: 'Eau de Parfum inspirado no calor das dunas ao entardecer: açafrão e tâmara abrem a composição, seguidos por rosa seca e especiarias sobre âmbar, baunilha e madeiras quentes.',
      categoriaId: catAmbar.id,
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Açafrão', 'Tâmara'],
      notasCoracao: ['Rosa Seca', 'Canela'],
      notasBase: ['Âmbar', 'Baunilha', 'Madeiras Quentes'],
      variacoes: [
        { id: 'var-08-50', sku: 'RARE-SABLE-50ML', volumeMl: 50, precoCentavos: 39500 },
        { id: 'var-08-100', sku: 'RARE-SABLE-100ML', volumeMl: 100, precoCentavos: 64000 },
      ],
    },
    {
      id: 'prod-09',
      nome: 'AMBAR FUMÉ',
      slug: 'ambar-fume',
      marcaSlug: 'rare-essence',
      imagemUrl: '/ambar.png',
      descricao: 'Eau de Parfum de resinas e âmbar aquecidos por especiarias, com um véu defumado de incenso e madeiras escuras; baunilha seca arremata a fragrância com elegância.',
      categoriaId: catAmbar.id,
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Pimenta Preta', 'Elemi'],
      notasCoracao: ['Incenso', 'Ládano'],
      notasBase: ['Âmbar', 'Baunilha Seca', 'Madeiras Escuras'],
      variacoes: [
        { id: 'var-09-50', sku: 'RARE-AMBAR-FUME-50ML', volumeMl: 50, precoCentavos: 45000 },
        { id: 'var-09-100', sku: 'RARE-AMBAR-FUME-100ML', volumeMl: 100, precoCentavos: 73000 },
      ],
    },
    {
      id: 'prod-10',
      nome: 'Tabac Doré',
      slug: 'tabac-dore',
      marcaSlug: 'imperial-parfums',
      imagemUrl: '/tabac.png',
      descricao: 'Folhas de tabaco dourado se entrelaçam com mel, rum envelhecido e cacau amargo. Uma composição opulenta, aquecida por fava tonka e madeiras preciosas.',
      categoriaId: catOriental.id,
      familiaOlfativa: FamiliaOlfativa.ESPECIADO,
      notasTopo: ['Rum Envelhecido', 'Gengibre'],
      notasCoracao: ['Folha de Charuto', 'Mel Selvagem', 'Cacau Amargo'],
      notasBase: ['Tabaco Loiro', 'Âmbar Doce', 'Madeiras Preciosas'],
      variacoes: [
        { id: 'var-10-50', sku: 'RARE-TABAC-50ML', volumeMl: 50, precoCentavos: 46000 },
        { id: 'var-10-100', sku: 'RARE-TABAC-100ML', volumeMl: 100, precoCentavos: 75000 },
      ],
    },
    {
      id: 'prod-11',
      nome: 'SOVRAN',
      slug: 'sovran',
      marcaSlug: 'vorine',
      imagemUrl: '/sovran.png',
      descricao: 'Eau de Parfum de aura sofisticada: bergamota e pimenta rosa conduzem a um coração de íris e especiarias suaves, assentado sobre patchouli e âmbar cremoso.',
      categoriaId: catOriental.id,
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Bergamota', 'Pimenta Rosa'],
      notasCoracao: ['Íris', 'Especiarias Suaves'],
      notasBase: ['Patchouli', 'Âmbar Cremoso'],
      variacoes: [
        { id: 'var-11-50', sku: 'RARE-SOVRAN-50ML', volumeMl: 50, precoCentavos: 45000 },
        { id: 'var-11-100', sku: 'RARE-SOVRAN-100ML', volumeMl: 100, precoCentavos: 73000 },
      ],
    },
    {
      id: 'prod-12',
      nome: 'RAYKKEN',
      slug: 'raykken',
      marcaSlug: 'rare-essence',
      imagemUrl: '/raykken.png',
      descricao: 'Uma fragrância urbana e marcante que mistura grapefruit vibrante e pimenta de Sichuan com vetiver terroso, cedro e um toque final de âmbar mineral.',
      categoriaId: catAmadeirado.id,
      familiaOlfativa: FamiliaOlfativa.AMADEIRADO,
      notasTopo: ['Grapefruit', 'Pimenta de Sichuan'],
      notasCoracao: ['Vetiver', 'Gerânio'],
      notasBase: ['Cedro', 'Âmbar Mineral'],
      variacoes: [
        { id: 'var-12-50', sku: 'RARE-RAYKKEN-50ML', volumeMl: 50, precoCentavos: 36000 },
        { id: 'var-12-100', sku: 'RARE-RAYKKEN-100ML', volumeMl: 100, precoCentavos: 59000 },
      ],
    },
  ];

  for (const p of perfumes) {
    const produto = await prisma.produto.create({
      data: {
        id: p.id,
        nome: p.nome,
        slug: p.slug,
        descricao: p.descricao,
        imagemUrl: p.imagemUrl,
        marcaId: marcaIds.get(p.marcaSlug)!,
        categoriaId: p.categoriaId,
        familiaOlfativa: p.familiaOlfativa,
        notasTopo: p.notasTopo,
        notasCoracao: p.notasCoracao,
        notasBase: p.notasBase,
        ativo: true,
        variacoes: {
          create: p.variacoes.map((v) => ({
            id: v.id,
            sku: v.sku,
            volumeMl: v.volumeMl,
            precoCentavos: v.precoCentavos,
            pesoGramas: 250,
            ativo: true,
            estoque: { create: { quantidadeFisica: 10 } },
          })),
        },
      },
    });

    console.log(` ✨ Fragrância criada: ${produto.nome} (${p.variacoes.length} variações)`);
  }

  console.log(
    `✅ Seed de demonstração concluído com ${perfumes.length} fragrâncias.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
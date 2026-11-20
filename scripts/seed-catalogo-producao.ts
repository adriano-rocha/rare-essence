import { FamiliaOlfativa, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Defina DATABASE_URL antes de executar.');
  }

  const host = new URL(databaseUrl).hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    throw new Error(`DATABASE_URL ainda aponta para ${host}. Use a URL do Neon.`);
  }

  console.log(`🌱 Populando catálogo com segurança no host: ${host}`);

  const marcas = [
    { nome: "Maison D'or", slug: 'maison-dor' },
    { nome: 'Forncedro', slug: 'forncedro' },
    { nome: 'VORINÉ', slug: 'vorine' },
    { nome: 'VETIGEY', slug: 'vetigey' },
    { nome: 'MANDRY', slug: 'mandry' },
    { nome: 'RAYHAAN', slug: 'rayhaan' },
    { nome: 'Imperial Parfums', slug: 'imperial-parfums' },
    { nome: 'Rare Essence Parfums', slug: 'rare-essence' },
  ];

  const marcaIds = new Map<string, string>();
  for (const m of marcas) {
    const registro = await prisma.marca.upsert({
      where: { slug: m.slug },
      update: {},
      create: m,
    });
    marcaIds.set(m.slug, registro.id);
  }

  const categorias = [
    { nome: 'Amadeirado Nobre', slug: 'amadeirado-nobre' },
    { nome: 'Oriental Especiado', slug: 'oriental-especiado' },
    { nome: 'Âmbar & Resinas', slug: 'ambar-resinas' },
    { nome: 'Couro Imperial', slug: 'couro-imperial' },
    { nome: 'Cítrico Luminoso', slug: 'citrico-luminoso' },
  ];

  const categoriaIds = new Map<string, string>();
  for (const c of categorias) {
    const registro = await prisma.categoria.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    categoriaIds.set(c.slug, registro.id);
  }

  const perfumes = [
    {
      nome: 'ÉLÉGANCE ROYALE',
      slug: 'elegance-royale',
      marcaSlug: 'maison-dor',
      categoriaSlug: 'ambar-resinas',
      imagemUrl: '/elegance.png',
      descricao: 'Uma criação luminosa de bergamota e açafrão que revela um coração de rosa aveludada e íris, repousando sobre âmbar dourado e madeiras nobres.',
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Bergamota', 'Açafrão'],
      notasCoracao: ['Rosa Aveludada', 'Íris'],
      notasBase: ['Âmbar Dourado', 'Madeiras Nobres'],
      variacoes: [
        { sku: 'RARE-ELEGANCE-50ML', volumeMl: 50, precoCentavos: 42000 },
        { sku: 'RARE-ELEGANCE-100ML', volumeMl: 100, precoCentavos: 68000 },
      ],
    },
    {
      nome: 'VULTRIX',
      slug: 'vultrix',
      marcaSlug: 'forncedro',
      categoriaSlug: 'ambar-resinas',
      imagemUrl: '/vultrix.png',
      descricao: 'Uma fragrância de presença intensa: pimenta negra e cardamomo abrem caminho para cedro seco, couro macio e um rastro profundo de âmbar e vetiver.',
      familiaOlfativa: FamiliaOlfativa.AMADEIRADO,
      notasTopo: ['Pimenta Negra', 'Cardamomo'],
      notasCoracao: ['Cedro Seco', 'Couro Macio'],
      notasBase: ['Âmbar', 'Vetiver'],
      variacoes: [
        { sku: 'RARE-VULTRIX-50ML', volumeMl: 50, precoCentavos: 39000 },
        { sku: 'RARE-VULTRIX-100ML', volumeMl: 100, precoCentavos: 63000 },
      ],
    },
    {
      nome: 'AMARÉNO',
      slug: 'amareno',
      marcaSlug: 'vorine',
      categoriaSlug: 'citrico-luminoso',
      imagemUrl: '/amareno.png',
      descricao: 'Eau de Parfum que combina mandarina madura e frutas douradas com um coração floral delicado; baunilha cremosa e sândalo deixam uma assinatura envolvente.',
      familiaOlfativa: FamiliaOlfativa.CITRICO,
      notasTopo: ['Mandarina', 'Frutas Douradas'],
      notasCoracao: ['Jasmim', 'Flor de Laranjeira'],
      notasBase: ['Baunilha', 'Sândalo'],
      variacoes: [
        { sku: 'RARE-AMARENO-50ML', volumeMl: 50, precoCentavos: 48000 },
        { sku: 'RARE-AMARENO-100ML', volumeMl: 100, precoCentavos: 79000 },
      ],
    },
    {
      nome: 'PURE AMAZON',
      slug: 'pure-amazon',
      marcaSlug: 'vetigey',
      categoriaSlug: 'citrico-luminoso',
      imagemUrl: '/amazon.png',
      descricao: 'Uma viagem verde pela floresta: folhas úmidas e cítricos frescos encontram ervas aromáticas e madeiras limpas, com um fundo mineral que evoca a chuva sobre a mata.',
      familiaOlfativa: FamiliaOlfativa.CITRICO,
      notasTopo: ['Lima', 'Folhas Verdes'],
      notasCoracao: ['Ervas Aromáticas', 'Chá Branco'],
      notasBase: ['Madeira Úmida', 'Acorde Mineral'],
      variacoes: [
        { sku: 'RARE-PURE-AMAZON-50ML', volumeMl: 50, precoCentavos: 44000 },
        { sku: 'RARE-PURE-AMAZON-100ML', volumeMl: 100, precoCentavos: 71000 },
      ],
    },
    {
      nome: 'CUIR MAJESTUEUX',
      slug: 'cuir-majestueux',
      marcaSlug: 'vorine',
      categoriaSlug: 'couro-imperial',
      imagemUrl: '/cuir.png',
      descricao: 'Eau de Parfum de couro elegante e especiado, com zimbro e pimenta rosa na abertura, tabaco no coração e cedro envolto em vetiver na base.',
      familiaOlfativa: FamiliaOlfativa.ESPECIADO,
      notasTopo: ['Zimbro', 'Pimenta Rosa'],
      notasCoracao: ['Folha de Tabaco', 'Sálvia Esclaréia'],
      notasBase: ['Couro da Toscana', 'Vetiver de Bourbon', 'Cedro da Virgínia'],
      variacoes: [
        { sku: 'RARE-CUIR-50ML', volumeMl: 50, precoCentavos: 44000 },
        { sku: 'RARE-CUIR-100ML', volumeMl: 100, precoCentavos: 71000 },
      ],
    },
    {
      nome: 'VELOURS CITRON RARE',
      slug: 'velours-citron-rare',
      marcaSlug: 'mandry',
      categoriaSlug: 'citrico-luminoso',
      imagemUrl: '/velours.png',
      descricao: 'Um cítrico macio e sofisticado: limão siciliano e bergamota brilham sobre neroli e chá branco, enquanto almíscar e cedro claro prolongam a sensação de frescor.',
      familiaOlfativa: FamiliaOlfativa.CITRICO,
      notasTopo: ['Limão Siciliano', 'Bergamota'],
      notasCoracao: ['Neroli', 'Chá Branco'],
      notasBase: ['Almíscar', 'Cedro Claro'],
      variacoes: [
        { sku: 'RARE-VELOURS-50ML', volumeMl: 50, precoCentavos: 41000 },
        { sku: 'RARE-VELOURS-100ML', volumeMl: 100, precoCentavos: 66000 },
      ],
    },
    {
      nome: 'FORNCEDRO',
      slug: 'forncedro',
      marcaSlug: 'forncedro',
      categoriaSlug: 'amadeirado-nobre',
      imagemUrl: '/forncedro.png',
      descricao: 'Eau de Parfum amadeirada que une cedro aromático a especiarias quentes e lavanda; fava tonka e âmbar suavizam o conjunto com um rastro confortável.',
      familiaOlfativa: FamiliaOlfativa.AMADEIRADO,
      notasTopo: ['Lavanda', 'Pimenta Rosa'],
      notasCoracao: ['Cedro', 'Noz-moscada'],
      notasBase: ['Fava Tonka', 'Âmbar'],
      variacoes: [
        { sku: 'RARE-FORNCEDRO-50ML', volumeMl: 50, precoCentavos: 43000 },
        { sku: 'RARE-FORNCEDRO-100ML', volumeMl: 100, precoCentavos: 69000 },
      ],
    },
    {
      nome: 'SABLE ÉTERNEL',
      slug: 'sable-eternel',
      marcaSlug: 'rayhaan',
      categoriaSlug: 'ambar-resinas',
      imagemUrl: '/sable.png',
      descricao: 'Eau de Parfum inspirado no calor das dunas ao entardecer: açafrão e tâmara abrem a composição, seguidos por rosa seca e especiarias sobre âmbar, baunilha e madeiras quentes.',
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Açafrão', 'Tâmara'],
      notasCoracao: ['Rosa Seca', 'Canela'],
      notasBase: ['Âmbar', 'Baunilha', 'Madeiras Quentes'],
      variacoes: [
        { sku: 'RARE-SABLE-50ML', volumeMl: 50, precoCentavos: 39500 },
        { sku: 'RARE-SABLE-100ML', volumeMl: 100, precoCentavos: 64000 },
      ],
    },
    {
      nome: 'AMBAR FUMÉ',
      slug: 'ambar-fume',
      marcaSlug: 'rare-essence',
      categoriaSlug: 'ambar-resinas',
      imagemUrl: '/ambar.png',
      descricao: 'Eau de Parfum de resinas e âmbar aquecidos por especiarias, com um véu defumado de incenso e madeiras escuras; baunilha seca arremata a fragrância com elegância.',
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Pimenta Preta', 'Elemi'],
      notasCoracao: ['Incenso', 'Ládano'],
      notasBase: ['Âmbar', 'Baunilha Seca', 'Madeiras Escuras'],
      variacoes: [
        { sku: 'RARE-AMBAR-FUME-50ML', volumeMl: 50, precoCentavos: 45000 },
        { sku: 'RARE-AMBAR-FUME-100ML', volumeMl: 100, precoCentavos: 73000 },
      ],
    },
    {
      nome: 'Tabac Doré',
      slug: 'tabac-dore',
      marcaSlug: 'imperial-parfums',
      categoriaSlug: 'oriental-especiado',
      imagemUrl: '/tabac.png',
      descricao: 'Folhas de tabaco dourado se entrelaçam com mel, rum envelhecido e cacau amargo. Uma composição opulenta, aquecida por fava tonka e madeiras preciosas.',
      familiaOlfativa: FamiliaOlfativa.ESPECIADO,
      notasTopo: ['Rum Envelhecido', 'Gengibre'],
      notasCoracao: ['Folha de Charuto', 'Mel Selvagem', 'Cacau Amargo'],
      notasBase: ['Tabaco Loiro', 'Âmbar Doce', 'Madeiras Preciosas'],
      variacoes: [
        { sku: 'RARE-TABAC-50ML', volumeMl: 50, precoCentavos: 46000 },
        { sku: 'RARE-TABAC-100ML', volumeMl: 100, precoCentavos: 75000 },
      ],
    },
    {
      nome: 'SOVRAN',
      slug: 'sovran',
      marcaSlug: 'vorine',
      categoriaSlug: 'oriental-especiado',
      imagemUrl: '/sovran.png',
      descricao: 'Eau de Parfum de aura sofisticada: bergamota e pimenta rosa conduzem a um coração de íris e especiarias suaves, assentado sobre patchouli e âmbar cremoso.',
      familiaOlfativa: FamiliaOlfativa.ORIENTAL,
      notasTopo: ['Bergamota', 'Pimenta Rosa'],
      notasCoracao: ['Íris', 'Especiarias Suaves'],
      notasBase: ['Patchouli', 'Âmbar Cremoso'],
      variacoes: [
        { sku: 'RARE-SOVRAN-50ML', volumeMl: 50, precoCentavos: 45000 },
        { sku: 'RARE-SOVRAN-100ML', volumeMl: 100, precoCentavos: 73000 },
      ],
    },
    {
      nome: 'RAYKKEN',
      slug: 'raykken',
      marcaSlug: 'rare-essence',
      categoriaSlug: 'amadeirado-nobre',
      imagemUrl: '/raykken.png',
      descricao: 'Uma fragrância urbana e marcante que mistura grapefruit vibrante e pimenta de Sichuan com vetiver terroso, cedro e um toque final de âmbar mineral.',
      familiaOlfativa: FamiliaOlfativa.AMADEIRADO,
      notasTopo: ['Grapefruit', 'Pimenta de Sichuan'],
      notasCoracao: ['Vetiver', 'Gerânio'],
      notasBase: ['Cedro', 'Âmbar Mineral'],
      variacoes: [
        { sku: 'RARE-RAYKKEN-50ML', volumeMl: 50, precoCentavos: 36000 },
        { sku: 'RARE-RAYKKEN-100ML', volumeMl: 100, precoCentavos: 59000 },
      ],
    },
  ];

  for (const p of perfumes) {
    const produto = await prisma.produto.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        nome: p.nome,
        slug: p.slug,
        descricao: p.descricao,
        imagemUrl: p.imagemUrl,
        marcaId: marcaIds.get(p.marcaSlug)!,
        categoriaId: categoriaIds.get(p.categoriaSlug)!,
        familiaOlfativa: p.familiaOlfativa,
        notasTopo: p.notasTopo,
        notasCoracao: p.notasCoracao,
        notasBase: p.notasBase,
        ativo: true,
      },
    });

    for (const v of p.variacoes) {
      const variacao = await prisma.variacao.upsert({
        where: { sku: v.sku },
        update: {},
        create: {
          produtoId: produto.id,
          sku: v.sku,
          volumeMl: v.volumeMl,
          precoCentavos: v.precoCentavos,
          pesoGramas: 250,
          ativo: true,
        },
      });

      await prisma.estoqueItem.upsert({
        where: { variacaoId: variacao.id },
        update: {},
        create: {
          variacaoId: variacao.id,
          quantidadeFisica: 10,
        },
      });
    }

    console.log(`✨ Pronto: ${produto.nome}`);
  }

  console.log('✅ Catálogo populado no Neon com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
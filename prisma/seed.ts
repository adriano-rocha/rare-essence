import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Catálogo Rare Essence (Noir & Âmbar)...');

  // Limpeza de tabelas para seed idempotente
  await prisma.variacao.deleteMany();
  await prisma.produto.deleteMany();
  await prisma.marca.deleteMany();
  await prisma.categoria.deleteMany();

  // 1. Marca Oficial
  const marca = await prisma.marca.create({
    data: {
      id: 'marca-rare',
      nome: 'Rare Essence Parfums',
      slug: 'rare-essence',
    },
  });

  // 2. Categorias Olfativas
  const categorias = await Promise.all([
    prisma.categoria.create({ data: { id: 'cat-amadeirado', nome: 'Amadeirado Nobre', slug: 'amadeirado-nobre' } }),
    prisma.categoria.create({ data: { id: 'cat-oriental', nome: 'Oriental Especiado', slug: 'oriental-especiado' } }),
    prisma.categoria.create({ data: { id: 'cat-ambarado', nome: 'Âmbar & Resinas', slug: 'ambar-resinas' } }),
    prisma.categoria.create({ data: { id: 'cat-couro', nome: 'Couro Imperial', slug: 'couro-imperial' } }),
  ]);

  const [catAmadeirado, catOriental, catAmbar, catCouro] = categorias;

  // 3. Os 10 Perfumes Oficiais de Alta Perfumaria
  const perfumes = [
    {
      id: 'prod-01',
      nome: 'Noir Absolu',
      slug: 'noir-absolu',
      descricao: 'Uma obra-prima misteriosa com bergamota italiana, incenso defumado e coração de cedro negro e oud envelhecido.',
      categoriaId: catAmadeirado.id,
      notasTopo: ['Bergamota Italiana', 'Cardamomo Preto'],
      notasCoracao: ['Íris Florentina', 'Cedro Negro'],
      notasBase: ['Oud de Assam', 'Âmbar Cinzento', 'Musgo de Carvalho'],
      variacoes: [
        { id: 'var-01-50', sku: 'RARE-NOIR-50ML', volumeMl: 50, precoCentavos: 42000 },
        { id: 'var-01-100', sku: 'RARE-NOIR-100ML', volumeMl: 100, precoCentavos: 68000 },
      ],
    },
    {
      id: 'prod-02',
      nome: 'Ambre Nocturne',
      slug: 'ambre-nocturne',
      descricao: 'O calor envolvente do âmbar dourado em fusão com baunilha de Madagascar e toques balsâmicos de benjoim.',
      categoriaId: catAmbar.id,
      notasTopo: ['Laranja Amarga', 'Canela do Ceilão'],
      notasCoracao: ['Benjoim do Sião', 'Fava Tonka'],
      notasBase: ['Âmbar Dourado', 'Baunilha Bourbon', 'Patchouli'],
      variacoes: [
        { id: 'var-02-50', sku: 'RARE-AMBRE-50ML', volumeMl: 50, precoCentavos: 39000 },
        { id: 'var-02-100', sku: 'RARE-AMBRE-100ML', volumeMl: 100, precoCentavos: 63000 },
      ],
    },
    {
      id: 'prod-03',
      nome: 'Oud Royal',
      slug: 'oud-royal',
      descricao: 'Majestoso e opulento, celebra a realeza do oud com açafrão persa, rosa damascena e couro aveludado.',
      categoriaId: catOriental.id,
      notasTopo: ['Açafrão Persa', 'Noz-moscada'],
      notasCoracao: ['Rosa Damascena', 'Ládano'],
      notasBase: ['Oud Cambojano', 'Sândalo da Índia', 'Couro'],
      variacoes: [
        { id: 'var-03-50', sku: 'RARE-OUD-50ML', volumeMl: 50, precoCentavos: 48000 },
        { id: 'var-03-100', sku: 'RARE-OUD-100ML', volumeMl: 100, precoCentavos: 79000 },
      ],
    },
    {
      id: 'prod-04',
      nome: 'Cuir Majestueux',
      slug: 'cuir-majestueux',
      descricao: 'O aroma aristocrático do couro nobre curado, envolvido por bagas de zimbro e tabaco amadeirado.',
      categoriaId: catCouro.id,
      notasTopo: ['Zimbro', 'Pimenta Rosa'],
      notasCoracao: ['Folha de Tabaco', 'Sálvia Esclaréia'],
      notasBase: ['Couro da Toscana', 'Vetiver de Bourbon', 'Cedro da Virgínia'],
      variacoes: [
        { id: 'var-04-50', sku: 'RARE-CUIR-50ML', volumeMl: 50, precoCentavos: 44000 },
        { id: 'var-04-100', sku: 'RARE-CUIR-100ML', volumeMl: 100, precoCentavos: 71000 },
      ],
    },
    {
      id: 'prod-05',
      nome: 'Santal Précieux',
      slug: 'santal-precieux',
      descricao: 'Cremosidade balsâmica incomparável de sândalo australiano, cardamomo fresco e violeta acetinada.',
      categoriaId: catAmadeirado.id,
      notasTopo: ['Cardamomo da Guatemala', 'Papiro'],
      notasCoracao: ['Violeta Francesa', 'Íris'],
      notasBase: ['Sândalo Australiano', 'Cedro do Atlas', 'Couro Macio'],
      variacoes: [
        { id: 'var-05-50', sku: 'RARE-SANTAL-50ML', volumeMl: 50, precoCentavos: 41000 },
        { id: 'var-05-100', sku: 'RARE-SANTAL-100ML', volumeMl: 100, precoCentavos: 66000 },
      ],
    },
    {
      id: 'prod-06',
      nome: 'Rose Noire',
      slug: 'rose-noire',
      descricao: 'Uma rosa gótica e carnal entrelaçada com patchouli terroso, trufa negra e especiarias noturnas.',
      categoriaId: catOriental.id,
      notasTopo: ['Trufa Negra', 'Açafrão'],
      notasCoracao: ['Rosa de Maio', 'Rosa Turca'],
      notasBase: ['Patchouli', 'Baunilha Negra', 'Oud'],
      variacoes: [
        { id: 'var-06-50', sku: 'RARE-ROSE-50ML', volumeMl: 50, precoCentavos: 43000 },
        { id: 'var-06-100', sku: 'RARE-ROSE-100ML', volumeMl: 100, precoCentavos: 69000 },
      ],
    },
    {
      id: 'prod-07',
      nome: 'Vanille Fumée',
      slug: 'vanille-fumee',
      descricao: 'Baunilha negra não gourmand, defumada por lenha de guaiaco, fumo nobre e resinas antigas.',
      categoriaId: catAmbar.id,
      notasTopo: ['Coentro', 'Cravinho'],
      notasCoracao: ['Tabaco Louro', 'Madeira Guaiaco'],
      notasBase: ['Baunilha de Madagascar', 'Olibano', 'Fava Tonka'],
      variacoes: [
        { id: 'var-07-50', sku: 'RARE-VANILLE-50ML', volumeMl: 50, precoCentavos: 39500 },
        { id: 'var-07-100', sku: 'RARE-VANILLE-100ML', volumeMl: 100, precoCentavos: 64000 },
      ],
    },
    {
      id: 'prod-08',
      nome: 'Tabac Doré',
      slug: 'tabac-dore',
      descricao: 'Folhas selecionadas de tabaco cubano maceradas em mel de flor de laranjeira, rum envelhecido e cacau.',
      categoriaId: catOriental.id,
      notasTopo: ['Rum Envelhecido', 'Gengibre'],
      notasCoracao: ['Folha de Charuto', 'Mel Selvagem', 'Cacau Amargo'],
      notasBase: ['Tabaco Loiro', 'Âmbar Doce', 'Madeiras Preciosas'],
      variacoes: [
        { id: 'var-08-50', sku: 'RARE-TABAC-50ML', volumeMl: 50, precoCentavos: 46000 },
        { id: 'var-08-100', sku: 'RARE-TABAC-100ML', volumeMl: 100, precoCentavos: 75000 },
      ],
    },
    {
      id: 'prod-09',
      nome: 'Iris Céleste',
      slug: 'iris-celeste',
      descricao: 'A elegância aristocrática da manteiga de íris com zimbro gelado, pimenta branca e almíscar mineral.',
      categoriaId: catAmadeirado.id,
      notasTopo: ['Bagas de Zimbro', 'Pimenta Branca'],
      notasCoracao: ['Manteiga de Íris Pallida', 'Mirra'],
      notasBase: ['Almíscar Branco', 'Âmbar Cinza', 'Madeira Flutuante'],
      variacoes: [
        { id: 'var-09-50', sku: 'RARE-IRIS-50ML', volumeMl: 50, precoCentavos: 45000 },
        { id: 'var-09-100', sku: 'RARE-IRIS-100ML', volumeMl: 100, precoCentavos: 73000 },
      ],
    },
    {
      id: 'prod-10',
      nome: 'Vetiver Sauvage',
      slug: 'vetiver-sauvage',
      descricao: 'Vetiver do Haiti na sua expressão mais pura, terrosa e esfumaçada, com toranja amarga e pimenta de Sichuan.',
      categoriaId: catAmadeirado.id,
      notasTopo: ['Toranja Rosa', 'Pimenta de Sichuan'],
      notasCoracao: ['Gerânio Bourbon', 'Noz-moscada'],
      notasBase: ['Vetiver do Haiti', 'Cedro do Atlas', 'Benjoim'],
      variacoes: [
        { id: 'var-10-50', sku: 'RARE-VETIVER-50ML', volumeMl: 50, precoCentavos: 38000 },
        { id: 'var-10-100', sku: 'RARE-VETIVER-100ML', volumeMl: 100, precoCentavos: 62000 },
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
        marcaId: marca.id,
        categoriaId: p.categoriaId,
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
          })),
        },
      },
    });

    console.log(` ✨ Fragrância criada: ${produto.nome} (${p.variacoes.length} variações)`);
  }

  console.log('✅ Seed oficial Rare Essence concluído com 10 fragrâncias de nicho!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
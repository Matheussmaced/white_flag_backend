import { PrismaClient, type ContentMode } from '@prisma/client';

const prisma = new PrismaClient();

interface CatalogSeed {
  code: string;
  label: string;
  mode: ContentMode;
}

const feelings: CatalogSeed[] = [
  { code: 'saudade', label: 'Estou com saudade', mode: 'NORMAL' },
  { code: 'carinho', label: 'Preciso de um carinho', mode: 'NORMAL' },
  { code: 'abraco', label: 'Preciso de um abraço', mode: 'NORMAL' },
  { code: 'conversar', label: 'Preciso conversar', mode: 'NORMAL' },
  { code: 'desculpa', label: 'Me desculpa', mode: 'NORMAL' },
  { code: 'orgulho', label: 'Tenho orgulho de você', mode: 'NORMAL' },
  { code: 'amor', label: 'Te amo', mode: 'NORMAL' },
  { code: 'pazes', label: 'Vamos fazer as pazes?', mode: 'NORMAL' },
  { code: 'beijo', label: 'Quero te beijar', mode: 'HOT' },
  { code: 'noite', label: 'Quero uma noite só nossa', mode: 'HOT' },
  { code: 'massagem', label: 'Quero te fazer uma massagem', mode: 'HOT' },
  { code: 'surpresa', label: 'Tenho uma surpresa pra você hoje', mode: 'HOT' },
];

const declineReasons: CatalogSeed[] = [
  { code: 'cansaco', label: 'Estou muito cansado(a) hoje', mode: 'HOT' },
  { code: 'sem_clima', label: 'Hoje não estou no clima', mode: 'HOT' },
  { code: 'sem_tempo', label: 'Hoje não tenho tempo', mode: 'HOT' },
  { code: 'conversar_antes', label: 'Prefiro conversar antes', mode: 'HOT' },
  { code: 'outro_dia', label: 'Vamos deixar para outro dia?', mode: 'HOT' },
];

const acceptNotes: CatalogSeed[] = [
  { code: 'topo_ansioso', label: 'Topo, estou ansioso(a)', mode: 'HOT' },
  { code: 'topo_agora', label: 'Topo, vem pra cá', mode: 'HOT' },
  { code: 'topo_noite', label: 'Topo, hoje à noite', mode: 'HOT' },
  { code: 'topo_surpresa', label: 'Topo, me surpreenda', mode: 'HOT' },
];

const diceChallenges: CatalogSeed[] = [
  { code: 'massagem_cinco', label: 'Faça uma massagem de 5 minutos no seu par', mode: 'NORMAL' },
  { code: 'lembranca', label: 'Conte a sua lembrança favorita de vocês dois', mode: 'NORMAL' },
  { code: 'elogio', label: 'Faça um elogio sincero ao seu par', mode: 'NORMAL' },
  { code: 'programa', label: 'Planeje um programa para o fim de semana', mode: 'NORMAL' },
  { code: 'danca', label: 'Dancem uma música juntos', mode: 'NORMAL' },
  { code: 'bilhete', label: 'Escreva um bilhete carinhoso para o seu par', mode: 'NORMAL' },
  { code: 'beijo_minuto', label: 'Troquem beijos por um minuto', mode: 'HOT' },
  { code: 'massagem_dez', label: 'Massagem relaxante de 10 minutos', mode: 'HOT' },
  {
    code: 'sussurro',
    label: 'Sussurre no ouvido do seu par o que mais gosta nele(a)',
    mode: 'HOT',
  },
  { code: 'olhos', label: 'Olhem nos olhos um do outro por um minuto em silêncio', mode: 'HOT' },
  { code: 'banho', label: 'Tomem um banho juntos', mode: 'HOT' },
  { code: 'fantasia', label: 'Conte uma fantasia que você tem com o seu par', mode: 'HOT' },
];

const peaceRules: CatalogSeed[] = [
  { code: 'ouvir', label: 'Ouvir sem interromper', mode: 'NORMAL' },
  { code: 'sentimento', label: 'Falar do que sente, e não de quem tem culpa', mode: 'NORMAL' },
  { code: 'sem_absolutos', label: 'Evitar as palavras sempre e nunca', mode: 'NORMAL' },
  { code: 'pausa', label: 'Fazer uma pausa se a conversa esquentar', mode: 'NORMAL' },
  { code: 'carinho_final', label: 'Terminar com um gesto de carinho', mode: 'NORMAL' },
  { code: 'toque', label: 'Selar a paz com um beijo ou um abraço demorado', mode: 'HOT' },
];

interface PeaceContentSeed {
  code: string;
  title: string;
  body: string;
  mode: ContentMode;
}

const peaceContents: PeaceContentSeed[] = [
  {
    code: 'respirar',
    title: 'Respire',
    body: 'Antes de falar, respire fundo e deixe o corpo se acalmar.',
    mode: 'NORMAL',
  },
  {
    code: 'reconhecer',
    title: 'Reconheça',
    body: 'Diga o que você sentiu e admita a sua parte no que aconteceu.',
    mode: 'NORMAL',
  },
  {
    code: 'desculpar',
    title: 'Peça desculpas',
    body: 'Peça desculpas de forma sincera pelo que foi seu, sem justificativas.',
    mode: 'NORMAL',
  },
  {
    code: 'escutar',
    title: 'Escute',
    body: 'Agora é a vez do outro. Escute até o fim, sem rebater.',
    mode: 'NORMAL',
  },
  {
    code: 'recomecar',
    title: 'Recomecem',
    body: 'Combinem uma forma de evitar que aconteça de novo e sigam em frente.',
    mode: 'NORMAL',
  },
  {
    code: 'reconectar',
    title: 'Reconectem',
    body: 'Fiquem juntos, sem pressa, e deixem o carinho voltar ao seu ritmo.',
    mode: 'HOT',
  },
];

const upsertAll = (
  items: CatalogSeed[],
  upsert: (item: CatalogSeed, sortOrder: number) => Promise<unknown>,
) => Promise.all(items.map((item, index) => upsert(item, index)));

async function main() {
  await upsertAll(feelings, (item, sortOrder) =>
    prisma.feeling.upsert({
      where: { code: item.code },
      update: { label: item.label, mode: item.mode, sortOrder },
      create: { ...item, sortOrder },
    }),
  );
  await upsertAll(declineReasons, (item, sortOrder) =>
    prisma.declineReason.upsert({
      where: { code: item.code },
      update: { label: item.label, mode: item.mode, sortOrder },
      create: { ...item, sortOrder },
    }),
  );
  await upsertAll(acceptNotes, (item, sortOrder) =>
    prisma.acceptNote.upsert({
      where: { code: item.code },
      update: { label: item.label, mode: item.mode, sortOrder },
      create: { ...item, sortOrder },
    }),
  );
  await upsertAll(diceChallenges, (item, sortOrder) =>
    prisma.diceChallenge.upsert({
      where: { code: item.code },
      update: { label: item.label, mode: item.mode, sortOrder },
      create: { ...item, sortOrder },
    }),
  );
  await upsertAll(peaceRules, (item, sortOrder) =>
    prisma.peaceRule.upsert({
      where: { code: item.code },
      update: { text: item.label, mode: item.mode, sortOrder },
      create: { code: item.code, text: item.label, mode: item.mode, sortOrder },
    }),
  );
  await Promise.all(
    peaceContents.map((item, sortOrder) =>
      prisma.peaceContent.upsert({
        where: { code: item.code },
        update: { title: item.title, body: item.body, mode: item.mode, sortOrder },
        create: { ...item, sortOrder },
      }),
    ),
  );
}

main().finally(() => prisma.$disconnect());

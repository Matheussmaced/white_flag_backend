import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export const API_TAGS = [
  { name: 'health', description: 'Verificação de disponibilidade do serviço' },
  {
    name: 'auth',
    description: 'Cadastro, login, renovação de sessão e recuperação de senha',
  },
  { name: 'couples', description: 'Pareamento de duas pessoas em um casal' },
  { name: 'feelings', description: 'Catálogo de sentimentos que podem virar bandeiras' },
  { name: 'flags', description: 'Envio e consulta das bandeiras trocadas entre o casal' },
  {
    name: 'catalogs',
    description: 'Catálogos de apoio: motivos de recusa, frases de aceite e desafios do dado',
  },
  { name: 'devices', description: 'Aparelhos que recebem notificações push' },
  { name: 'diary', description: 'Diário privado de cada usuário, um registro por dia' },
  { name: 'peace', description: 'Caminho das pazes e registro de que o casal fez as pazes' },
  { name: 'settings', description: 'Preferências do usuário: notificações e modo hot' },
  { name: 'presence', description: 'Sinal de atividade do usuário no app' },
  { name: 'account', description: 'Exclusão da conta e dos dados pessoais (LGPD)' },
  { name: 'users', description: 'Perfil do usuário autenticado' },
];

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'White Flag API',
        description:
          'API do White Flag, um aplicativo para casais. Rotas protegidas exigem o cabeçalho Authorization: Bearer <accessToken>. Todas as mensagens de erro são retornadas em português.',
        version: '0.1.0',
      },
      tags: API_TAGS,
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', persistAuthorization: true },
  });
}

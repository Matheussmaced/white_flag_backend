import { z } from 'zod';

const errorDefinitions = {
  400: {
    description: 'Requisição inválida: os dados enviados não passaram na validação',
    code: 'VALIDATION_ERROR',
    message: 'Falha na validação da requisição',
  },
  401: {
    description: 'Credenciais ausentes, inválidas ou expiradas',
    code: 'UNAUTHORIZED',
    message: 'Não autenticado',
  },
  403: {
    description: 'O usuário não tem permissão para executar esta ação',
    code: 'FORBIDDEN',
    message: 'Acesso negado',
  },
  404: {
    description: 'Recurso não encontrado',
    code: 'NOT_FOUND',
    message: 'Recurso não encontrado',
  },
  409: {
    description: 'Conflito com o estado atual do recurso',
    code: 'CONFLICT',
    message: 'O recurso já existe',
  },
  422: {
    description: 'Requisição compreendida, mas não pode ser processada',
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Não foi possível processar a requisição',
  },
  429: {
    description: 'Limite de requisições excedido',
    code: 'TOO_MANY_REQUESTS',
    message: 'Muitas requisições. Tente novamente em instantes.',
  },
  500: {
    description: 'Erro inesperado no servidor',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno do servidor',
  },
} as const;

type ErrorStatus = keyof typeof errorDefinitions;

export const errorResponseSchema = z.object({
  statusCode: z.number().int().meta({ description: 'Código de status HTTP' }),
  code: z.string().meta({ description: 'Código de erro estável, legível por máquina' }),
  message: z.string().meta({ description: 'Mensagem de erro em português, própria para exibição' }),
  details: z
    .unknown()
    .optional()
    .meta({ description: 'Dados adicionais, como os campos que falharam na validação' }),
});

const buildErrorSchema = (statusCode: ErrorStatus) => {
  const { description, code, message } = errorDefinitions[statusCode];

  return errorResponseSchema.meta({ description, example: { statusCode, code, message } });
};

export const errorResponses = <const T extends ErrorStatus[]>(...statuses: T) => {
  const allStatuses: ErrorStatus[] = [...statuses, 500];

  return Object.fromEntries(
    allStatuses.map((status) => [status, buildErrorSchema(status)]),
  ) as Record<T[number] | 500, ReturnType<typeof buildErrorSchema>>;
};

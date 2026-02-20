import { z } from 'zod';
import { insertSubscriptionSchema, subscriptions } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/me' as const,
      responses: {
        200: z.any(), // User or null
      },
    },
  },
  subscriptions: {
    list: {
      method: 'GET' as const,
      path: '/api/subscriptions' as const,
      responses: {
        200: z.array(z.custom<typeof subscriptions.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/subscriptions/:id' as const,
      responses: {
        200: z.custom<typeof subscriptions.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/subscriptions' as const,
      input: insertSubscriptionSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof subscriptions.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/subscriptions/:id' as const,
      input: insertSubscriptionSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof subscriptions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/subscriptions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    export: {
      method: 'GET' as const,
      path: '/api/subscriptions/export' as const,
      responses: {
        200: z.string(), // CSV string
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type SubscriptionInput = z.infer<typeof api.subscriptions.create.input>;
export type SubscriptionResponse = z.infer<typeof api.subscriptions.create.responses[201]>;
export type SubscriptionUpdateInput = z.infer<typeof api.subscriptions.update.input>;
export type SubscriptionsListResponse = z.infer<typeof api.subscriptions.list.responses[200]>;

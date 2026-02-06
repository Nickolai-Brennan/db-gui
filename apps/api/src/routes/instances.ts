import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { runChecklist } from '../checklist/runner';

const UUIDSchema = z.string().uuid();

export async function instancesRoutes(app: FastifyInstance) {
  // TODO: Add rate limiting for production use
  app.post('/api/v1/checklist-instances/:instanceId/run', async (req) => {
    const instanceId = UUIDSchema.parse((req.params as any).instanceId);

    const Body = z.object({
      targetDatabaseUrl: z.string().min(10),
      schemas: z.array(z.string().min(1)).min(1),
      mode: z.enum(['all', 'items']).default('all'),
      nodeIds: z.array(z.string().uuid()).optional(),
    });

    const body = Body.parse(req.body);

    const result = await runChecklist({
      instanceId,
      targetDatabaseUrl: body.targetDatabaseUrl,
      schemas: body.schemas,
      mode: body.mode,
      nodeIds: body.nodeIds,
    });

    return result;
  });
}

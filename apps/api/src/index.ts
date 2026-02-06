import Fastify from "fastify";
import { introspectRoutes } from "./routes/introspect";
import { instancesRoutes } from "./routes/instances";
import { annotationsRoutes } from "./routes/annotations";

const app = Fastify({ 
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: false,
      useDefaults: true,
      coerceTypes: 'array',
    },
  },
});

// CORS support for local development
await app.register(import("@fastify/cors"), {
  origin: true,
});

// Error handler
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }

  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
  });
});

// Health check endpoint
app.get("/health", async () => {
  return { ok: true };
});

// Register routes
await app.register(introspectRoutes);
await app.register(instancesRoutes);
await app.register(annotationsRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

await app.listen({ port, host });
console.log(`✅ API server listening on http://${host}:${port}`);

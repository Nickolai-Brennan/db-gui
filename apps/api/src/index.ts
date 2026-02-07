import Fastify from "fastify";
import sensible from '@fastify/sensible';
import { introspectRoutes } from "./routes/introspect";
import { instancesRoutes } from "./routes/instances";
import { annotationsRoutes } from "./routes/annotations";
import { templatesRoutes } from "./routes/templates";
import { nodesRoutes } from "./routes/nodes";
import { sqlRoutes } from "./routes/sql";
import { issuesRoutes } from "./routes/issues";

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: false,
      useDefaults: true,
      coerceTypes: "array",
    },
  },
});

await app.register(sensible);

// CORS support for local development
await app.register(import("@fastify/cors"), {
  origin: true,
});

// Error handler
app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  // Type guard for Fastify validation errors
  const isFastifyError = (
    err: unknown
  ): err is { validation: unknown; statusCode?: number; name?: string; message?: string } => {
    return typeof err === "object" && err !== null && "validation" in err;
  };

  if (isFastifyError(error)) {
    return reply.status(400).send({
      error: "Validation Error",
      message: error.message || "Request validation failed",
      details: error.validation,
    });
  }

  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? ((error.statusCode as number) ?? 500)
      : 500;

  reply.status(statusCode).send({
    error: (typeof error === "object" && error !== null && "name" in error
      ? error.name
      : "Internal Server Error") as string,
    message: (typeof error === "object" && error !== null && "message" in error
      ? error.message
      : "An unexpected error occurred") as string,
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
await app.register(templatesRoutes);
await app.register(nodesRoutes);
await app.register(sqlRoutes);
await app.register(issuesRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

await app.listen({ port, host });
console.log(`✅ API server listening on http://${host}:${port}`);

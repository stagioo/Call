import { auth } from "@call/auth/auth";
import { env } from "@/config/env";
import { cors } from "hono/cors";
import { db } from "@call/db";
import routes from "@/routes";
import { Hono } from "hono";
import { logger } from "hono/logger";
export interface ReqVariables {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
  db: typeof db | null;
}

const app = new Hono<{ Variables: ReqVariables }>();

app.use("*", logger());

// Configuración de CORS mejorada
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Permitir requests sin origin (como mobile apps o Postman)
      if (!origin) return "*";
      
      // Verificar si el origin está en la lista de permitidos
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With",
      "Accept",
      "Origin"
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 horas
  })
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("db", null);
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("db", db);
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.route("/api", routes);

export default {
  port: 1284,
  fetch: app.fetch,
};
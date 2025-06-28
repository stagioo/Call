import { env } from "@/config/env";
import routes from "@/routes";
import { auth } from "@call/auth/auth";
import { db } from "@call/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createServer, IncomingMessage } from "node:http";
import { WebSocketServer } from "./websocket-server";

process.env.PORT = "1284";

export interface ReqVariables {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
  db: typeof db | null;
}

const app = new Hono<{ Variables: ReqVariables }>();

app.use("*", logger());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("db", db);

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.route("/api", routes);

function incomingMessageToReadableStream(req: IncomingMessage): ReadableStream {
  return new ReadableStream({
    start(controller) {
      req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      req.on("end", () => controller.close());
      req.on("error", (err) => controller.error(err));
    },
  });
}

const port = 1284;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(
      req.url || "",
      `http://${req.headers.host || "localhost"}`
    );
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? incomingMessageToReadableStream(req)
          : null,
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error("Error handling request:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

new WebSocketServer(server);

console.log(`Server is running on port ${port}`);
server.listen(port);

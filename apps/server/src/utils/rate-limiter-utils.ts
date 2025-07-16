import {
  RateLimiterRes,
  type RateLimiterAbstract,
} from "rate-limiter-flexible";
import type { Context, Next } from "hono";

const HEADER_PREFIX = "RateLimit-";
const FALLBACK_KEY = "anonymous";
const LOG_PREFIX = "[RateLimiter]";

export interface RateLimiterConfig {
  limiter: RateLimiterAbstract;
  getKey?: (c: Context) => string;
  onRateLimitExceeded?: (
    c: Context,
    rateLimiterRes: RateLimiterRes,
    limiter: RateLimiterAbstract
  ) => Response;
  logger?: (message: string, ...args: unknown[]) => void;
}

export function getKeyFromContext(c: Context): string {
  let key: string = FALLBACK_KEY;

  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) {
      key = ips[0];
    }
  } else {
    const headers = [
      c.req.header("cf-connecting-ip"),
      c.req.header("x-real-ip"),
      c.req.header("x-client-ip"),
    ];
    const foundHeader = headers.find((h) => h != null && h.trim() !== "");
    if (foundHeader) {
      key = foundHeader;
    }
  }

  key = key.replace(/[^a-zA-Z0-9.:]/g, "");

  if (!key || key.length < 1) {
    key = FALLBACK_KEY;
  }

  return key;
}

export function setRateLimitHeaders(
  c: Context,
  rateLimiterRes: RateLimiterRes,
  limiter: RateLimiterAbstract
): void {
  const now = Date.now();
  const limit = limiter.points.toString();
  const remaining = rateLimiterRes.remainingPoints.toString();
  const reset = Math.ceil((now + rateLimiterRes.msBeforeNext) / 1000).toString();
  const used = (limiter.points - rateLimiterRes.remainingPoints).toString();

  c.res.headers.set(`${HEADER_PREFIX}Limit`, limit);
  c.res.headers.set(`${HEADER_PREFIX}Remaining`, remaining);
  c.res.headers.set(`${HEADER_PREFIX}Reset`, reset);

  c.res.headers.set(`X-${HEADER_PREFIX}Limit`, limit);
  c.res.headers.set(`X-${HEADER_PREFIX}Remaining`, remaining);
  c.res.headers.set(`X-${HEADER_PREFIX}Reset`, reset);
  c.res.headers.set(`X-${HEADER_PREFIX}Used`, used);
}

export function createRateLimiterMiddleware(
  config: RateLimiterConfig
): (c: Context, next: Next) => Promise<Response | void> {
  const { limiter, getKey = getKeyFromContext, onRateLimitExceeded, logger = console.log } = config;

  return async (c: Context, next: Next) => {
    const key = getKey(c);

    try {
      const rateLimiterRes = await limiter.consume(key);
      setRateLimitHeaders(c, rateLimiterRes, limiter);
      return next();
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        logger(`${LOG_PREFIX} Exceeded for key "${key}": Remaining ${err.remainingPoints}, Reset in ${err.msBeforeNext}ms`);

        setRateLimitHeaders(c, err, limiter);

        if (onRateLimitExceeded) {
          return onRateLimitExceeded(c, err, limiter);
        }

        return c.json(
          {
            success: false,
            error: "Too many requests. Please wait before trying again.",
            details: {
              retryAfter: Math.ceil(err.msBeforeNext / 1000),
            },
          },
          429,
          {
            "Retry-After": Math.ceil(err.msBeforeNext / 1000).toString(),
          }
        );
      }

      logger(`${LOG_PREFIX} Unexpected error for key "${key}":`, err);
      return c.json(
        {
          success: false,
          error: "Internal server error. Please try again later.",
        },
        500
      );
    }
  };
}
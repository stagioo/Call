import { RateLimiterRedis } from "rate-limiter-flexible";
import redisClient from "./valkey.js";

export const waitlistRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 3,
  duration: 120, // 2 minutes
  blockDuration: 60 * 60,
  keyPrefix: "rl:waitlist",
});

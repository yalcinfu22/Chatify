import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

const redis = Redis.fromEnv();

// Authenticated users → normal limits
export const burstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 s"),
});

export const sustainedLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(300, "5 m"),
});

// Guests → stricter limits
export const guestBurstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export const guestSustainedLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "5 m"),
});

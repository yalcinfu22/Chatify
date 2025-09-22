import { guestBurstLimiter, guestSustainedLimiter } from "../config/upstash.js";

const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.ip;
};

export const guestRateLimiter = async (req, res, next) => {

  try {
    // More reliable ip extraction
    const key = `ip:${getClientIP(req)}`;

    // Parallel rate limit check (Faster)
    const [burst, sustained] = await Promise.all([
      guestBurstLimiter.limit(key),
      guestSustainedLimiter.limit(key)
    ]);

    if (!burst.success) {
      return res.status(429).json({
        success: false,
        errorMessage: "Too many requests in a short time (guest burst limit).",
      });
    }

    if (!sustained.success) {
      return res.status(429).json({
        success: false,
        errorMessage: "Too many requests overall (guest sustained limit).",
      });
    }

    // Rate limit passed
    next();
  } catch (error) {
    console.error("Guest rate limit error", error);
    res.status(429).json({
      success: false,
      errorMessage: "Internal server error (guest rate limiter).",
    });
  }
};

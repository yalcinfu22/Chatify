import { burstLimiter, sustainedLimiter } from "../config/upstash.js";

export const userRateLimiter = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        errorMessage: "Unauthorized",
      });
    }

    const key = `user:${req.user.userId}`;

    // Parallel rate limit check (Faster)
    const [burst, sustained] = await Promise.all([
      burstLimiter.limit(key),
      sustainedLimiter.limit(key)
    ]);


    if (!burst.success) {
      return res.status(429).json({
        success: false,
        errorMessage: "Too many requests in a short time (burst limit).",
      });
    }

    if (!sustained.success) {
      return res.status(429).json({
        success: false,
        errorMessage: "Too many requests overall (sustained limit).",
      });
    }

    // Limitler geçildi → devam
    next();
  } catch (error) {
    console.error("User rate limit error", error);
    res.status(500).json({
      success: false,
      errorMessage: "Internal server error",
    });
  }
};

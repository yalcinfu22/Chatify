import { 
  burstLimiter, sustainedLimiter, 
  guestBurstLimiter, guestSustainedLimiter 
} from "../config/upstash.js";

export const rateLimiter = async (req, res, next) => {
  try {
    let key;
    let burst, sustained;

    if (req.user?.id) {
      // Authenticated user → normal limits
      key = `user:${req.user.id}`;
      burst = await burstLimiter.limit(key);
      sustained = await sustainedLimiter.limit(key);
    } else {
      // Guest user → fallback to IP, stricter limits
      key = `ip:${req.ip}`;
      burst = await guestBurstLimiter.limit(key);
      sustained = await guestSustainedLimiter.limit(key);
    }

    if (!burst.success) {
      return res.status(429).json({
        message: "Too many requests in a short time. Please slow down.",
      });
    }

    if (!sustained.success) {
      return res.status(429).json({
        message: "Too many requests overall. Please wait a bit.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit error", error);
    next(error);
  }
};

export default rateLimiter;

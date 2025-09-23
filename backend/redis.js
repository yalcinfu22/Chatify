import { Redis } from '@upstash/redis';

// Upstash Redis client'ını oluştur
const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// Bağlantı test fonksiyonu
const connectRedis = async () => {
  try {
    const result = await redisClient.ping();
    console.log('✅ Connected to Upstash Redis successfully!', result);
  } catch (err) {
    console.error('❌ Upstash Redis Connection Error:', err);
    throw err;
  }
};

export { redisClient, connectRedis };
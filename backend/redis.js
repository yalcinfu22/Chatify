import { createClient } from 'redis';

// Redis client'ını oluştur.
const redisClient = createClient({
    // Eğer Redis'i Docker ile veya lokalde default portta çalıştırıyorsan
    // buraya bir URL girmene gerek yok.
    // url: 'redis://<user>:<password>@<host>:<port>'
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Connected to Redis successfully!'));

// Asenkron olarak bağlantıyı kur.
const connectRedis = async () => {
    await redisClient.connect();
};

// Bağlantıyı ana sunucu dosyasında başlatmak için fonksiyonu export et.
export { redisClient, connectRedis };
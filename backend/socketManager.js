// socketManager.js

// Başlangıçta, io sunucumuz henüz oluşturulmadı.
let ioInstance = null;

/**
 * Socket.IO sunucu instance'ını bu modülün hafızasında saklar.
 * Bu fonksiyon, sadece sunucu ilk başladığında socket.js tarafından çağrılır.
 * @param {Server} io - Socket.IO Server instance'ı.
 */
export const setIoInstance = (io) => {
    console.log("Socket.IO instance has been set.");
    ioInstance = io;
};

/**
 * Saklanan Socket.IO sunucu instance'ını döndürür.
 * Projenin herhangi bir yerinden (servisler vb.) io'ya erişmek için bu fonksiyon kullanılır.
 * @returns {Server | null} Socket.IO Server instance'ı veya henüz ayarlanmadıysa null.
 */
export const getIoInstance = () => {
    return ioInstance;
};
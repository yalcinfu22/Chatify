/**
 * Backend'den gelen cevap objesinden anlamlı hata mesajını çıkarır.
 * @param {object} data - response.data veya error.response.data objesi
 * @returns {string} Gösterilecek hata mesajı
 */
const getErrorMessage = (data) => {
    let message = "Bilinmeyen bir hata oluştu."; // Varsayılan mesaj
    if (data) {
        const { fields, errorMessage } = data;
        // Öncelik: Alan-spesifik hata mesajı
        if (fields && Array.isArray(fields) && fields.length > 0 && fields[0].errorMessage) {
            message = fields[0].errorMessage;
       
        // İkinci Öncelik: Genel hata mesajı
        } else if (errorMessage) {
            message = errorMessage;
        }
    }
    return message;
};

export default getErrorMessage;
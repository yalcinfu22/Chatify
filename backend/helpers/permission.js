// helpers/permission.helper.js

/**
 * Verilen kullanıcının, belirli bir sohbet grubunu yönetme yetkisi (admin) olup olmadığını kontrol eder.
 * @param {object} chat - Mongoose'dan gelen tam chat dökümanı.
 * @param {string} userId - Kontrol edilecek kullanıcının ID'si.
 * @returns {boolean} Kullanıcı admin ise true, değilse false döner.
 */
export const canUserManageGroup = (chat, userId) => {
    // Önce temel kontrolleri yapalım
    if (!chat || !chat.isGroupChat || !userId) {
        return false;
    }

    // .some() metodu, dizideki en az bir eleman koşulu sağlarsa true döner.
    // Koşulumuz: Dizideki adminId'lerden herhangi birinin string'e çevrilmiş hali,
    // bizim userId string'imize eşit mi?
    const isAdmin = chat.admins.some(adminId => adminId.toString() === userId.toString());

    return isAdmin;
};

/**
 * Verilen kullanıcının, bir sohbetin üyesi olup olmadığını kontrol eder.
 * @param {object} chat - Mongoose'dan gelen tam chat dökümanı.
 * @param {string} userId - Kontrol edilecek kullanıcının ID'si.
 * @returns {boolean} Kullanıcı üye ise true, değilse false döner.
 */
export const isUserMemberOfChat = (chat, userId) => {
    if (!chat || !userId) {
        return false;
    }
    return chat.members.some(memberId => memberId.toString() === userId.toString());
};
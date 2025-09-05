import { customAlphabet } from 'nanoid';

const generateInviteCode = () => {
    // Sadece büyük harfler ve rakamlar kullanarak, okunması kolay bir kod üretelim.
    // 'O' ve '0' gibi karışabilecek karakterleri çıkarabiliriz.
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(alphabet, 10); // 10 karakter uzunluğunda
    return nanoid(); // Örnek: 'A5T8B1H9KL'
};

export default generateInviteCode
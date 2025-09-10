// middleware/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/user-profile-pictures');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `profile_${uniqueSuffix}${extension}`);
    }
});

// Storage configuration for group pictures
const groupStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/chat-group-pictures');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `group_${uniqueSuffix}${extension}`);
    }
});

// Storage configuration for chat messages
const messageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/chat-messages');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        console.log('--- MESSAGE FILENAME ÇALIŞIYOR ---'); 
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `message_${uniqueSuffix}${extension}`);
    }
});



// FILE TYPE BELİRLEME FONKSİYONU
const determineFileType = (mimetype) => {
    if (mimetype === 'image/gif') {
        return 'gif';  // GIF ayrı kategori
    } else if (mimetype.startsWith('video/')) {
        return 'video'; // Video türleri
    } else if (mimetype.startsWith('image/')) {
        return 'image'; // Diğer tüm resimler (jpeg, png, webp, vs.)
    } else {
        return 'image'; // Default
    }
};

// FILE FILTER
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        // Normal images
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/bmp',
        // GIF (ayrı kategori olacak)
        'image/gif',
        // Videos
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/webm'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        // File objesine fileType'ı ekle
        file.fileType = determineFileType(file.mimetype);
        cb(null, true);
    } else {
        cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`), false);
    }
};


// Create upload instances
export const profileUpload = multer({
    storage: profileStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});

export const groupUpload = multer({
    storage: groupStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});

export const messageUpload = multer({
    storage: messageStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15MB limit
    }
});

export default { profileUpload, groupUpload, messageUpload };
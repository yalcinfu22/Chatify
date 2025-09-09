// models/imageModel.js
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    // Dosyanın sunucudaki yolu veya bulut depolama URL'si. En kritik alan.
    url: { 
        type: String, 
        required: true 
    },
    // Bu dosyayı kimin yüklediği. Güvenlik ve sahiplik için önemli.
    uploader: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Dosya tipi (profil resmi, sohbet resmi, video vb.)
    // Bu, ileride farklı dosya tiplerini yönetmeni kolaylaştırır.
    fileType: {
        type: String,
        enum: ['image', 'video', 'gif', 'file'],
        default: 'image'
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);
export default Image;
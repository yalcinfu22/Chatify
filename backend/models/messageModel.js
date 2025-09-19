import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
    content: {
        type: String,
        trim: true
    },
    // Bu mesajın tipi ne?
    contentType: {
        type: String,
        enum: ['text', 'link', 'emoji', 'file', 'image', 'video', 'gif', 'hybrid', 'system'],
        default: 'text'
    },
    // EĞER contentType 'image', 'video' vb. ise,
    // Image koleksiyonundaki ilgili dökümanın ID'si burada tutulacak.
    attachment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        default: null
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
}, { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 }); // chat'e göre olan sorguları hızlandırmak için gerekli

const Message = mongoose.model('Message', messageSchema);
export default Message;
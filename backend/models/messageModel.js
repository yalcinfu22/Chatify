import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
    content: {
        type: String,
        trim: true
    },
    contentType: {
        type: String,
        enum: ['text', 'link', 'emoji', 'video', 'image'],
        default: 'text'
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
    }
}, { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);
export default Message;
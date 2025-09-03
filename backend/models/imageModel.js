import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    imageType: {
        type: String,
        enum: ['video', 'image'],
        default: 'image'
    },
}, { timestamps: true }
);

const Message = mongoose.model('Image', messageSchema);
export default Message;
import mongoose from 'mongoose';

const chatSchema = mongoose.Schema(
    {
        chatName: { 
            type: String,
            required: true
        },
        users: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // User modeline referans
            },
        ],
        isGroupChat: { 
            type: Boolean, 
            default: false 
        },
        groupPicture: {
            type: String,
            default: null // Will store the file path/URL
        },
        groupAdmins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // User modeline referans
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
import mongoose from 'mongoose';

const chatSchema = mongoose.Schema(
    {
        chatName: { 
            type: String,
            required: true
        },
        isGroupChat: { 
            type: Boolean, 
            default: false 
        },
        chatImage: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Image',
          required: false
        },
        groupAdmin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        users: [
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
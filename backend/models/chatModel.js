import mongoose from 'mongoose';

const chatSchema = mongoose.Schema(
    {
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // User modeline referans
            },
        ],
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        },
        hiddenFor: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isGroupChat: { 
            type: Boolean, 
            default: false 
        },
        inviteCode: {
            type: String,
            unique: true, // indexed by inviteCode
            // We will only generate this for group chats, so it's not required for direct chats
            sparse: true,  // does not count null
            required: false, 
        },
        name: {
            type: String,
            default: null
        },
        groupPicture: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Image',
            default: null // Will store the file path/URL
        },
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // User modeline referans
            },
        ],
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
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
    },
    {timestamps: true}
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
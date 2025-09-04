import mongoose from 'mongoose';
import { createRef } from 'react';

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
        isGroupChat: { 
            type: Boolean, 
            default: false 
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
            required: true,
            ref: 'User'
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
    },
    {timestamps: true}
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
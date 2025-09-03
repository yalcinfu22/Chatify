import mongoose from 'mongoose';
import { createRef } from 'react';

const chatSchema = mongoose.Schema(
    {
        name: { 
            type: String,
            required: true
        },
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
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        isGroupChat: { 
            type: Boolean, 
            default: false 
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
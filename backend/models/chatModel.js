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
    },
    {
        timestamps: true,
    }
);

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
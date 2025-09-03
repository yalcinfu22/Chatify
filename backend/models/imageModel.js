import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  // Original filename from user
  originalName: {
    type: String,
    required: true
  },
  // Unique filename we create (to avoid conflicts)
  filename: {
    type: String,
    required: true,
    unique: true
  },
  // Full path where file is stored
  filePath: {
    type: String,
    required: true
  },
  // File details
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number, // in bytes
    required: true
  },
  // What type of image this is
  imageType: {
    type: String,
    enum: ['ProfilePicture', 'ChatPicture'],
    required: true
  },
  // Who uploaded it
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Soft delete (mark as deleted without removing file)
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


const Image = mongoose.model('Image', imageSchema);
export default Image;
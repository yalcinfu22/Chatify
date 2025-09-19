import mongoose from "mongoose";

const userSchema = new mongoose.Schema({ // bir hizmet kullanıcısı tam adı, erişim bilgileri, login bilgileri, rol başlık vs detaylar + CRUD
  username: {
    type: String,
    required: function() { return !this.isSystem; }, 
    unique: true, // indexed by username
    sparse: true // NOT: unique index'in null değerleri görmezden gelmesini sağlar
  },
  password: { 
      type: String, 
      required: function() { return !this.isSystem; } 
  },
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: function() { return !this.isSystem; } ,
    unique: true, // indexed by phone
    sparse: true // NOT: unique index'in null değerleri görmezden gelmesini sağlar
  },
  profilePicture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: null,
  },
  chats: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Chat', // User modeline referans
      },
  ],
  isOnline: {
    type: Boolean,
    default: false,
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
  deletedAt: {
    type: Date,
    required: false
  },
  lastSeen: {
    type: Date,
    required: false
  },
  isSystem: {
      type: Boolean, 
      required: false
  },
}, {timestamps: true}
);

userSchema.index({ isSystem: 1 }, { sparse: true }); // system objesini diğerlerinden ayırır isSystem ile anında buluruz! NO-SQL!

const User = mongoose.model("User", userSchema); // create a collection of notes in the database return CMO (collection manager object)
export default User; // use your collection manager elsewhere

// var let farkı

// jwt token oluşturma login olunca
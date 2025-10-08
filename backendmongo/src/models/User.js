import mongoose from 'mongoose';

const User = new mongoose.Schema(
    {
        username: { type: String, unique: true, required: true, trim: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        // 🛑 NEW FIELDS ADDED BELOW FOR PROFILE MANAGEMENT
        fullName: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, unique: true, sparse: true }, // Added unique constraint and sparse for optionality
        mobileNumber: { type: String, trim: true, default: '' },
    },
    {
        versionKey: false,
        toJSON: {
            transform: (_doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.password; // never send password
            },
        },
    }
);

export default mongoose.model('User', User);
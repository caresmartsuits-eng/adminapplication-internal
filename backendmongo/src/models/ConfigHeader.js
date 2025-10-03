import mongoose from 'mongoose';

const ConfigHeader = new mongoose.Schema(
  {
    category_code: { type: String, required: true, unique: true, trim: true },
    category_description_english: { type: String, required: true, trim: true },
    category_description_telugu: { type: String, required: true, trim: true },
    created_by: { type: String, default: null },
    created_date: { type: String, required: true }, // ISO string to match current API
    status: { type: String, enum: ['A', 'D'], default: 'A' },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  }
);

export default mongoose.model('ConfigHeader', ConfigHeader);

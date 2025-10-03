import mongoose from 'mongoose';

const Configuration = new mongoose.Schema(
  {
    category: { type: String, required: true, index: true },
    english_description: { type: String, required: true },
    telugu_description: { type: String, required: true },
    sort_order: { type: Number, required: true },
    created_date: { type: String, required: true }, // ISO string
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

export default mongoose.model('Configuration', Configuration);

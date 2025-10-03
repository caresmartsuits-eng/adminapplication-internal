import mongoose from 'mongoose';

const Audit = new mongoose.Schema(
  {
    action: { type: String, required: true },
    username: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() }, // keep string to match current API
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
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

export default mongoose.model('Audit', Audit);

import mongoose from 'mongoose';

const Order = new mongoose.Schema(
  {
    snum: { type: String, required: true, index: { unique: true } },
    order_number: { type: Number, required: true },
    product_type: { type: String, required: true },
    delivery_date: { type: String, required: true }, // keep as string to match current API
    status: { type: String, required: true },
    assigned_user: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    person: { type: String, required: true, trim: true },

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

export default mongoose.model('Order', Order);

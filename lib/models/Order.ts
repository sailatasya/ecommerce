import mongoose from "mongoose";
import Product from "./Product";

const orderSchema = new mongoose.Schema({
  sessionId: String,
  customerClerkId: String,
  products: [
    {
      product: {
        // Reference to the Product model
        type: mongoose.Schema.Types.ObjectId,
        // 
        ref: Product,
      },
      productId: String,
      color: String,
      size: String,
      quantity: Number,
    },
  ],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  shippingRate: String,
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// If the model already exists, use it; otherwise, create a new one
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;

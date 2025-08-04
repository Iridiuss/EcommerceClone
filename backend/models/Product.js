 // models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: [{
    type: String,
    required: true,
  }],
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
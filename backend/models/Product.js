// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    minlength: [2, 'Product name must be at least 2 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Product description cannot exceed 1000 characters'],
    minlength: [10, 'Product description must be at least 10 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    max: [999999, 'Price cannot exceed 999,999']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    required: [true, 'At least one product image is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'Images array cannot be empty'
    }
  }],
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: [true, 'Seller is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  numReviews: {
    type: Number,
    min: [0, 'Number of reviews cannot be negative'],
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
  return this.numReviews > 0 ? this.rating / this.numReviews : 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock < 10) return 'low_stock';
  return 'in_stock';
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ category: 1 }); // Category filtering
productSchema.index({ price: 1 }); // Price sorting
productSchema.index({ rating: -1 }); // Rating sorting
productSchema.index({ createdAt: -1 }); // Recent products
productSchema.index({ seller: 1, status: 1 }); // Seller's active products
productSchema.index({ stock: 1, status: 1 }); // Stock and status filtering

// Pre-save middleware to update status based on stock
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.status = 'out_of_stock';
  } else if (this.stock < 10) {
    this.status = 'active';
  }
  next();
});

// Instance method to check if product is available
productSchema.methods.isAvailable = function() {
  return this.status === 'active' && this.stock > 0;
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock = Math.max(0, this.stock - quantity);
  if (this.stock === 0) {
    this.status = 'out_of_stock';
  }
  return this.save();
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

// Static method to find low stock products
productSchema.statics.findLowStock = function(threshold = 10) {
  return this.find({ stock: { $lt: threshold }, status: 'active' });
};

export default mongoose.model("Product", productSchema);
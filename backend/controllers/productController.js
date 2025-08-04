 // controllers/productController.js
import Product from "../models/Product.js";
import uploadImage from "../utils/uploadImage.js";

export const addProduct = async (req, res) => {
  try {
    const { name, description, price, images } = req.body;
    
    if (!name || !description || !price || !images || images.length === 0) {
      return res.status(400).json({ message: 'All fields are required and at least one image is needed' });
    }

    // Filter out null/empty images and upload to Cloudinary
    const validImages = images.filter(img => img && img.trim() !== '');
    
    if (validImages.length === 0) {
      return res.status(400).json({ message: 'At least one valid image is required' });
    }

    // Upload multiple images to Cloudinary
    const uploadedImages = await Promise.all(
      validImages.map(image => uploadImage(image))
    );

    const product = await Product.create({ 
      name, 
      description, 
      price, 
      images: uploadedImages, 
      seller: req.user._id 
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all products (for customer browsing)
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("seller", "name");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get seller's own products (for seller dashboard)
export const getSellerProducts = async (req, res) => {
  try {
    // Only return products created by the current seller
    const products = await Product.find({ seller: req.user._id }).populate("seller", "name");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("seller", "name");
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, images } = req.body;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the product belongs to the authenticated seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }
    
    // Validate required fields
    if (!name || !description || !price) {
      return res.status(400).json({ message: 'Name, description, and price are required' });
    }
    
    // Handle image updates
    let updatedImages = product.images; // Keep existing images by default
    
    if (images && images.length > 0) {
      // Filter out null/empty images and upload new ones to Cloudinary
      const validImages = images.filter(img => img && img.trim() !== '');
      
      if (validImages.length > 0) {
        // Upload new images to Cloudinary
        const uploadedImages = await Promise.all(
          validImages.map(image => uploadImage(image))
        );
        updatedImages = uploadedImages;
      }
    }
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        images: updatedImages,
      },
      { new: true, runValidators: true }
    ).populate('seller', 'name');
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete product with ID: ${id}`);
    console.log(`User ID: ${req.user._id}`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      console.log(`Product not found with ID: ${id}`);
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`Product found: ${product.name}, Seller ID: ${product.seller}`);
    
    // Check if the product belongs to the authenticated seller
    if (product.seller.toString() !== req.user._id.toString()) {
      console.log(`Authorization failed: Product seller (${product.seller}) != User (${req.user._id})`);
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }
    
    const deletedProduct = await Product.findByIdAndDelete(id);
    console.log(`Product deleted successfully: ${deletedProduct.name}`);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ message: error.message });
  }
};
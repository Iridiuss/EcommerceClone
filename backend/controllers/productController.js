// controllers/productController.js
import Product from "../models/Product.js";
import uploadImage from "../utils/uploadImage.js";
import { asyncHandler, handleDatabaseError, handleCloudinaryError } from "../utils/errorHandler.js";
import { logger, logDatabase } from "../utils/logger.js";
import { NotFoundError, AuthorizationError, ValidationError } from "../utils/errorHandler.js";

// Add product with comprehensive validation and error handling
export const addProduct = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { name, description, price, category, stock, images } = req.body;
  
  // Debug logging
  console.log('Add Product Request:', {
    name: name?.substring(0, 50) + '...',
    description: description?.substring(0, 50) + '...',
    price,
    category,
    stock,
    imagesCount: images?.length || 0,
    userId: req.user?._id
  });
  
  try {
    // Validate required fields
    if (!name || !description || !price || !category || !stock || !images || images.length === 0) {
      console.log('Validation failed - missing fields:', { name: !!name, description: !!description, price: !!price, category: !!category, stock: !!stock, images: images?.length });
      throw new ValidationError('All fields are required and at least one image is needed');
    }

    // Filter out null/empty images and upload to Cloudinary
    const validImages = images.filter(img => img && img.trim() !== '');
    
    if (validImages.length === 0) {
      throw new ValidationError('At least one valid image is required');
    }

    // Upload multiple images to Cloudinary with error handling
    const uploadedImages = await Promise.all(
      validImages.map(async (image) => {
        try {
          return await uploadImage(image);
        } catch (error) {
          handleCloudinaryError(error, 'image upload');
        }
      })
    );

    // Create product with enhanced data
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim(),
      stock: parseInt(stock),
      images: uploadedImages,
      seller: req.user._id,
      status: 'active'
    };

    const product = await Product.create(productData);
    
    // Log successful operation
    const duration = Date.now() - startTime;
    logDatabase('create', 'Product', duration, true);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('create', 'Product', duration, false);
    throw error;
  }
});

// Get all products with pagination, filtering, and sorting
export const getAllProducts = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { page = 1, limit = 10, category, minPrice, maxPrice, sort = '-createdAt', search } = req.query;
  
  try {
    // Build query
    const query = { status: 'active' };
    
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate("seller", "name email")
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    const duration = Date.now() - startTime;
    logDatabase('find', 'Product', duration, true);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('find', 'Product', duration, false);
    throw error;
  }
});

// Get seller's own products with enhanced features
export const getSellerProducts = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { page = 1, limit = 10, status, sort = '-createdAt' } = req.query;
  
  try {
    // Build query for seller's products
    const query = { seller: req.user._id };
    if (status) query.status = status;

    // Build sort object
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .populate("seller", "name email")
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count and stats
    const total = await Product.countDocuments(query);
    const stats = await Product.aggregate([
      { $match: { seller: req.user._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          avgPrice: { $avg: '$price' },
          lowStock: { $sum: { $cond: [{ $lt: ['$stock', 10] }, 1, 0] } }
        }
      }
    ]);
    
    const duration = Date.now() - startTime;
    logDatabase('find', 'Product', duration, true);
    
    res.json({
      success: true,
      data: products,
      stats: stats[0] || {
        totalProducts: 0,
        totalValue: 0,
        avgPrice: 0,
        lowStock: 0
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('find', 'Product', duration, false);
    throw error;
  }
});

// Get single product with enhanced error handling
export const getProduct = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  try {
    // Validate MongoDB ObjectId format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      throw new ValidationError('Invalid product ID format');
    }
    
    const product = await Product.findById(id)
      .populate("seller", "name email")
      .lean();
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    const duration = Date.now() - startTime;
    logDatabase('findById', 'Product', duration, true);
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('findById', 'Product', duration, false);
    throw error;
  }
});

// Update product with comprehensive validation
export const updateProduct = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const { name, description, price, category, stock, images, status } = req.body;
  
  try {
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    // Check authorization
    if (product.seller.toString() !== req.user._id.toString()) {
      throw new AuthorizationError('update this product');
    }
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (price) updateData.price = parseFloat(price);
    if (category) updateData.category = category.trim();
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (status) updateData.status = status;
    
    // Handle image updates
    if (images && images.length > 0) {
      const validImages = images.filter(img => img && img.trim() !== '');
      
      if (validImages.length > 0) {
        const uploadedImages = await Promise.all(
          validImages.map(async (image) => {
            try {
              return await uploadImage(image);
            } catch (error) {
              handleCloudinaryError(error, 'image upload');
            }
          })
        );
        updateData.images = uploadedImages;
      }
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');
    
    const duration = Date.now() - startTime;
    logDatabase('update', 'Product', duration, true);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('update', 'Product', duration, false);
    throw error;
  }
});

// Delete product with enhanced security
export const deleteProduct = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  
  try {
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    // Check authorization
    if (product.seller.toString() !== req.user._id.toString()) {
      throw new AuthorizationError('delete this product');
    }
    
    // HARD DELETE - Actually remove the product from database
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    const duration = Date.now() - startTime;
    logDatabase('delete', 'Product', duration, true);
    
    res.json({
      success: true,
      message: 'Product permanently deleted',
      data: { id: deletedProduct._id, name: deletedProduct.name }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('delete', 'Product', duration, false);
    throw error;
  }
});

// Get product statistics for dashboard
export const getProductStats = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  try {
    const stats = await Product.aggregate([
      { $match: { seller: req.user._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
          avgPrice: { $avg: '$price' },
          lowStock: { $sum: { $cond: [{ $lt: ['$stock', 10] }, 1, 0] } }
        }
      }
    ]);
    
    const duration = Date.now() - startTime;
    logDatabase('aggregate', 'Product', duration, true);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalProducts: 0,
        totalValue: 0,
        avgPrice: 0,
        lowStock: 0
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logDatabase('aggregate', 'Product', duration, false);
    throw error;
  }
});

// Debug route to list all products (development only)
export const debugProducts = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    throw new AuthorizationError('Debug routes not available in production');
  }
  
  try {
    const products = await Product.find({})
      .select('_id name seller createdAt')
      .populate('seller', 'name email')
      .lean();
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    throw error;
  }
});
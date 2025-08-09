'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { FormSkeleton } from '@/components/LoadingSkeleton';

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: ['']
  });

  // Memoized form validation
  const formErrors = useMemo(() => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.stock || parseInt(formData.stock) < 0) errors.stock = 'Valid stock quantity is required';
    
    const validImages = formData.images.filter(img => img && img.trim() !== '');
    if (validImages.length === 0) errors.images = 'At least one image is required';
    
    return errors;
  }, [formData]);

  // Memoized form validity
  const isFormValid = useMemo(() => {
    return Object.keys(formErrors).length === 0;
  }, [formErrors]);

  // Memoized image compression function
  const compressImage = useCallback((file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Memoized form change handler
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Memoized file change handler
  const handleFileChange = useCallback(async (index, file) => {
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        setFormData(prev => ({
          ...prev,
          images: prev.images.map((img, i) => i === index ? compressedImage : img)
        }));
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original method if compression fails
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => i === index ? e.target.result : img)
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  }, [compressImage]);

  // Memoized add image field handler
  const addImageField = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, null]
    }));
  }, []);

  // Memoized remove image field handler
  const removeImageField = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  // Memoized submit handler
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Please fix the form errors before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Filter out null/empty images
      const validImages = formData.images.filter(img => img && img.trim() !== '');
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: validImages,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (response.ok) {
        const product = await response.json();
        toast.success('Product added successfully!');
        router.push('/seller/products');
      } else {
        const error = await response.json();
        console.error('Backend error:', error);
        
        // Show specific validation errors if available
        if (error.errorMessage) {
          toast.error(`Validation Error: ${error.errorMessage}`);
        } else if (error.message) {
          toast.error(`Error: ${error.message}`);
        } else {
          toast.error('Error adding product. Please check all fields.');
        }
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, isFormValid, router]);

  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product listing for your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your product..."
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                  formErrors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {formErrors.price && (
              <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Electronics, Clothing, Books"
            />
            {formErrors.category && (
              <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
            )}
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.stock ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter stock quantity"
            />
            {formErrors.stock && (
              <p className="mt-1 text-sm text-red-600">{formErrors.stock}</p>
            )}
          </div>

          {/* Product Images */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Product Images *
              </label>
              <button
                type="button"
                onClick={addImageField}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                + Add Another Image
              </button>
            </div>
            
            {/* Image Upload Fields */}
            {formData.images.map((image, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {index === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Upload images from your device (JPG, PNG, GIF supported)
                  </p>
                )}
              </div>
            ))}

            {formErrors.images && (
              <p className="mt-1 text-sm text-red-600">{formErrors.images}</p>
            )}

            {/* Image Previews */}
            {formData.images.some(img => img) && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Image Previews
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    image && (
                      <div key={index} className="relative border border-gray-300 rounded-lg p-2">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          ×
                        </button>
                        <p className="text-xs text-gray-500 mt-1 text-center">Image {index + 1}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Product...
                </>
              ) : (
                'Add Product'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
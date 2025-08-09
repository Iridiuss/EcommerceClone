'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ProductListSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import React from 'react'; // Added for React.useState and React.useEffect

export default function ProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered and sorted products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle price sorting
      if (sortBy === 'price') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [products, debouncedSearchTerm, sortBy, sortOrder]);

  // Memoized statistics
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;
    const lowStock = products.filter(product => product.stock < 10).length;

    return {
      totalProducts,
      totalValue,
      avgPrice,
      lowStock
    };
  }, [products]);

  // Memoized fetch products function
  const fetchProducts = useCallback(async () => {
    try {
      console.log('🔍 DEBUG: fetchProducts called');
      console.log('🔍 DEBUG: authLoading:', authLoading);
      console.log('🔍 DEBUG: isAuthenticated:', isAuthenticated);
      console.log('🔍 DEBUG: user:', user);
      
      // Wait for auth to be ready
      if (authLoading) {
        console.log('🔍 DEBUG: Auth is still loading, returning');
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('🔍 DEBUG: User is not authenticated');
        toast.error('Please login to view your products');
        setProducts([]);
        setLoading(false);
        return;
      }

      // Get token from localStorage (AuthContext should have already validated it)
      const token = localStorage.getItem('token');
      console.log('🔍 DEBUG: Token from localStorage:', token ? 'Token exists' : 'No token');
      console.log('🔍 DEBUG: User:', user);
      console.log('🔍 DEBUG: Is authenticated:', isAuthenticated);
      
      // NEW: Check what's actually in localStorage
      console.log('🔍 DEBUG: All localStorage keys:', Object.keys(localStorage));
      console.log('🔍 DEBUG: Raw token value:', token);
      console.log('🔍 DEBUG: Token length:', token ? token.length : 0);
      
      if (!token) {
        console.log('🔍 DEBUG: No token found in localStorage');
        toast.error('Authentication token not found. Please login again.');
        setProducts([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/products/seller', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 DEBUG: Products API response status:', response.status);
      console.log('🔍 DEBUG: Authorization header sent:', `Bearer ${token.substring(0, 20)}...`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Products API response:', result);
        
        // Extract products from the response structure
        const productsData = result.data || result || [];
        
        // Ensure productsData is an array
        if (!Array.isArray(productsData)) {
          console.error('Products data is not an array:', productsData);
          setProducts([]);
          return;
        }
        
        console.log('Setting products:', productsData.length, 'products found');
        setProducts(productsData);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch products:', response.status, errorData);
        
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          // Redirect to login
          window.location.href = '/';
        } else if (response.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
        } else {
          toast.error(`Failed to load products: ${errorData.message || 'Unknown error'}`);
        }
        
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Network error while loading products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Card component with auto-rotating images and dot indicators
  const ProductCard = ({ product }) => {
    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);
    const [progress, setProgress] = React.useState(0); // 0-100 progress for current slide
    const images = (product.images && product.images.length > 0) ? product.images.slice(0, 3) : [];

    const SLIDE_MS = 4000; // slower slide
    const TICK_MS = 50;
    const intervalRef = React.useRef(null);
    const startRef = React.useRef(Date.now());

    React.useEffect(() => {
      if (!images || images.length === 0) return;
      if (paused) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      startRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startRef.current;
        const pct = Math.min(100, (elapsed / SLIDE_MS) * 100);
        setProgress(pct);
        if (elapsed >= SLIDE_MS) {
          startRef.current = Date.now();
          setIndex((prev) => (prev + 1) % images.length);
          setProgress(0);
        }
      }, TICK_MS);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [images.length, paused, index]);

    // Reset when product images list changes (e.g., new data)
    React.useEffect(() => {
      setIndex(0);
      setProgress(0);
      startRef.current = Date.now();
    }, [images.length]);

    const currentImg = images[index] || 'https://via.placeholder.com/600x400?text=No+Image';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div
          className="relative w-full h-48 bg-gray-100 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <img
            src={currentImg}
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/600x400?text=No+Image'; }}
          />
          {/* Stock badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${product.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {product.stock < 10 ? `Low stock (${product.stock})` : `In stock (${product.stock})`}
            </span>
          </div>
          {/* Progress indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 px-2.5 flex gap-1">
              {images.map((_, i) => {
                // determine fill for each bar
                const fill = i < index ? 100 : i === index ? Math.min(100, progress) : 0;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <div key={i} className="h-1 flex-1 rounded-full bg-white/40 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-[width] duration-150"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold text-gray-900 line-clamp-1" title={product.name}>{product.name}</h3>
            <div className="ml-2 text-lg font-bold text-gray-900">${Number(product.price).toFixed(2)}</div>
          </div>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2" title={product.description}>{product.description}</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.category || 'Uncategorized'}</span>
            <span className="text-xs font-medium text-gray-700">Qty: {product.stock}</span>
          </div>

          <div className="mt-4 flex gap-2">
            <Link href={`/seller/products/${product._id}`} className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100">
              View
            </Link>
            <Link href={`/seller/products/${product._id}/edit`} className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded hover:bg-green-100">
              Edit
            </Link>
            <button
              onClick={() => handleDelete(product._id)}
              disabled={deleting === product._id}
              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
            >
              {deleting === product._id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Memoized delete handler
  const handleDelete = useCallback(async (productId) => {
    // Add confirmation using toast
    const confirmed = await new Promise((resolve) => {
      toast((t) => (
        <div className="flex flex-col space-y-3">
          <div className="font-semibold">Delete Product</div>
          <div>Are you sure you want to delete this product? This action cannot be undone.</div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
      });
    });

    if (!confirmed) {
      return;
    }

    setDeleting(productId);
    const deleteToast = toast.loading('Deleting product...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please login again.', { id: deleteToast });
        return;
      }

      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Optimistic update - remove from state immediately
        setProducts(prev => prev.filter(product => product._id !== productId));
        toast.success('Product deleted successfully!', { id: deleteToast });
      } else {
        const error = await response.json();
        toast.error(`Failed to delete product: ${error.message}`, { id: deleteToast });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error deleting product. Please try again.', { id: deleteToast });
    } finally {
      setDeleting(null);
    }
  }, []);

  // Memoized sort handler
  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
          <p className="text-gray-600 mt-2">Manage your product listings</p>
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  // Debug: Check localStorage directly
  if (typeof window !== 'undefined') {
    const directToken = localStorage.getItem('token');
    const directUser = localStorage.getItem('user');
    console.log('🔍 DIRECT DEBUG: localStorage check:', { 
      directToken: !!directToken, 
      directUser: !!directUser,
      tokenValue: directToken ? directToken.substring(0, 20) + '...' : null
    });
  }

  // Show login message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-4">Please login to view your products</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
          <p className="text-gray-600 mt-2">Manage your product listings</p>
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
            <p className="text-gray-600 mt-2">Manage your product listings</p>
          </div>
          <Link
            href="/seller/add-product"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Products</div>
            <div className="text-2xl font-bold text-gray-800">{stats.totalProducts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Total Value</div>
            <div className="text-2xl font-bold text-gray-800">${stats.totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Average Price</div>
            <div className="text-2xl font-bold text-gray-800">${stats.avgPrice.toFixed(2)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">Low Stock</div>
            <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="createdAt">Date</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Start by adding your first product to your store'
            }
          </p>
          {!searchTerm && (
            <Link
              href="/seller/add-product"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-7">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
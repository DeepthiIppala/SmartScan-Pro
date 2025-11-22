'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BarcodeScanner from '@/components/BarcodeScanner';
import AIProductRecognition from '@/components/AIProductRecognition';
import AIVisualSearch from '@/components/AIVisualSearch';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const processingBarcodeRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    loadProducts();
    loadCartCount();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const cart = await api.cart.get();
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    } catch (error) {
      console.error('Failed to load cart count', error);
    }
  };

  const handleScan = async (barcode: string) => {
    // CRITICAL: Check if ANY scan is currently being processed
    if (isProcessingRef.current) {
      console.log('A scan is already being processed, ignoring this call');
      return;
    }

    // Check if this specific barcode is already being processed
    if (processingBarcodeRef.current === barcode) {
      console.log('Already processing this barcode, ignoring duplicate');
      return;
    }

    // IMMEDIATELY set processing flags to prevent any other calls
    isProcessingRef.current = true;
    processingBarcodeRef.current = barcode;

    try {
      const product = await api.products.getByBarcode(barcode);
      await api.cart.addItem(barcode, 1);
      toast.success(`Added ${product.name} to cart!`);
      loadCartCount(); // Update cart count
    } catch {
      // Use warning toast instead of error for better UX
      toast('Product not found in database', {
        icon: '⚠️',
        duration: 3000
      });
      // Log as info, not error, since this is expected behavior
      console.info('Product not found:', barcode);
    } finally {
      // Reset after 2 seconds to allow rescanning the same item
      setTimeout(() => {
        processingBarcodeRef.current = null;
        isProcessingRef.current = false;
      }, 2000);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await api.cart.addItem(product.barcode, 1);
      toast.success(`Added ${product.name} to cart!`);
      loadCartCount(); // Update cart count
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  const handleAIProductRecognized = (productData: { product_name: string; confidence: number }) => {
    toast.success(`AI identified: ${productData.product_name} (${productData.confidence * 100}% confident)`);
    // You can display the recognized product or search for it in your database
    console.log('AI Recognized Product:', productData);
  };

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery)
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price-low') {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="mt-2 text-base text-gray-700 dark:text-gray-100 font-medium">
              Welcome, {user?.email}! Scan or browse products to add to your cart.
            </p>
          </div>

          {/* View Cart Button */}
          <button
            onClick={() => router.push('/cart')}
            className="relative bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            View Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Barcode Scanner */}
        <div className="mb-8">
          <BarcodeScanner onScan={handleScan} />
        </div>

        {/* AI Product Recognition */}
        <AIProductRecognition onProductRecognized={handleAIProductRecognized} />

        {/* AI Visual Search */}
        <AIVisualSearch />

        {/* Product Grid */}
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Products</h2>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price-low' | 'price-high')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">Loading products...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-300 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300 text-center">
                {searchQuery ? `No products found matching "${searchQuery}"` : 'No products available. Contact admin to add products.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/lib/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// Predefined categories
const CATEGORIES = [
  { value: 'all', label: 'All Products', icon: '🛍️' },
  { value: 'men', label: 'Men', icon: '👔' },
  { value: 'women', label: 'Women', icon: '👗' },
  { value: 'kids', label: 'Kids', icon: '👶' },
  { value: 'home decor', label: 'Home Decor', icon: '🏠' },
  { value: 'others', label: 'Others', icon: '📦' },
];

export default function BrowseProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [cartItemCount, setCartItemCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    loadProducts();
    loadCartCount();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.products.getAll();
      console.log('Loaded products:', data.length);
      console.log('Sample product categories:', data.slice(0, 5).map(p => ({ name: p.name, category: p.category })));
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

  const handleAddToCart = async (product: Product) => {
    try {
      await api.cart.addItem(product.barcode, 1);
      toast.success(`Added ${product.name} to cart!`);
      loadCartCount(); // Refresh cart count
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery);

      // Category matching - normalize to lowercase and handle "others"
      let matchesCategory = selectedCategory === 'all';

      if (!matchesCategory) {
        if (product.category) {
          const productCategory = product.category.toLowerCase().trim();
          const selectedCategoryLower = selectedCategory.toLowerCase().trim();

          if (selectedCategoryLower === 'others') {
            // "Others" includes products that don't match any predefined category
            const predefinedCategories = ['men', 'women', 'kids', 'home decor'];
            matchesCategory = !predefinedCategories.includes(productCategory);
          } else {
            // Direct match
            matchesCategory = productCategory === selectedCategoryLower;
          }
        } else if (selectedCategory === 'others') {
          // Products without category go to "others"
          matchesCategory = true;
        }
      }

      return matchesSearch && matchesCategory;
    })
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
      <div className="min-h-screen relative bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Background Image Overlay */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/shopping-bg.png"
            alt="Shopping Background"
            fill
            className="object-cover opacity-100"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-cyan-50/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Category Filter Buttons */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg font-medium text-sm transition-all ${
                    selectedCategory === category.value
                      ? 'bg-[#4169E1] text-white shadow-md transform scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-[#4169E1] hover:shadow-md'
                  }`}
                >
                  <span className="text-2xl mb-2">{category.icon}</span>
                  <span className="text-xs sm:text-sm">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
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
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1] transition-all shadow-sm"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price-low' | 'price-high')}
              className="px-4 py-3 bg-white border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1] sm:w-48 transition-all shadow-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Product Count */}
          {!loading && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4169E1] mx-auto"></div>
              <p className="text-gray-600 mt-4 text-sm">Loading products...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 text-center shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-700 font-semibold text-lg mb-2">
                {searchQuery ? `No products found matching "${searchQuery}"` : 'No products available'}
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try a different search term or category' : 'Check back soon for new items'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
      </div>
    </ProtectedRoute>
  );
}

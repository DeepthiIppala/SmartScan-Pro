'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import toast from 'react-hot-toast';

interface VisualSearchResult {
  products: Product[];
  matches: number;
}

export default function AIVisualSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<VisualSearchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Convert to base64 and search
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.ai.visualSearch(base64);
      setSearchResults(result);

      if (result.products.length > 0) {
        toast.success(`Found ${result.products.length} similar products!`);
      } else {
        toast.error('No similar products found. Try another image!');
      }
    } catch (error) {
      console.error('Visual search failed:', error);
      toast.error('Failed to search. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddToCart = async (barcode: string) => {
    try {
      await api.cart.addItem(barcode, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  const clearSearch = () => {
    setPreviewImage(null);
    setSearchResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-[#4169E1] to-[#3557C1] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
          title="AI Visual Search"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
          <span className="absolute -top-1 -right-1 bg-yellow-400 h-3 w-3 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[480px] h-[700px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4169E1] to-[#3557C1] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#4169E1]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold">AI Visual Search</h3>
                <p className="text-xs opacity-90">Find products from any photo</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {/* Upload Area */}
            {!previewImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#4169E1] rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-[#4169E1] mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-900 font-semibold mb-2">Upload a Photo</p>
                <p className="text-gray-600 text-sm">
                  From Instagram, Pinterest, or anywhere!
                </p>
                <p className="text-gray-500 text-xs mt-2">Max 5MB • JPG, PNG, WEBP</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview & Results */}
            {previewImage && (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative">
                  <Image
                    src={previewImage}
                    alt="Search query"
                    width={800}
                    height={400}
                    unoptimized
                    className="w-full h-48 object-cover rounded-lg border-2 border-[#4169E1]"
                  />
                  <button
                    onClick={clearSearch}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {uploading && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#4169E1] border-t-transparent"></div>
                    <p className="text-gray-700 mt-4">Searching with AI...</p>
                  </div>
                )}

                {/* Results Summary */}
                {searchResults && !uploading && searchResults.products.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border border-[#4169E1] rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Search Results:</p>
                    <p className="text-gray-900 font-bold text-lg">Found {searchResults.matches} matching products</p>
                  </div>
                )}

                {/* Matches */}
                {searchResults && searchResults.products.length > 0 && !uploading && (
                  <div>
                    <h3 className="text-gray-900 font-bold mb-3">
                      Similar Products ({searchResults.products.length})
                    </h3>
                    <div className="space-y-3">
                      {searchResults.products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-[#4169E1] transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="text-gray-900 font-semibold">{product.name}</h4>
                              <p className="text-gray-500 text-xs mt-1">Barcode: {product.barcode}</p>
                            </div>
                            <span className="text-green-600 font-bold text-xl ml-2">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-end mt-3">
                            <button
                              onClick={() => handleAddToCart(product.barcode)}
                              className="bg-[#4169E1] hover:bg-[#3557C1] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Matches */}
                {searchResults && searchResults.products.length === 0 && !uploading && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 font-semibold mb-2">No exact matches found</p>
                    <p className="text-yellow-700 text-sm">Try uploading a different image or adjust the photo angle</p>
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            {!previewImage && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-gray-900 font-bold mb-2">How it works:</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#4169E1] font-semibold">1.</span>
                    <span>Upload any photo of clothing, accessories, or home goods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4169E1] font-semibold">2.</span>
                    <span>Our AI analyzes the image and identifies the items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4169E1] font-semibold">3.</span>
                    <span>Find similar products instantly in our inventory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4169E1] font-semibold">4.</span>
                    <span>Add to cart and checkout - all in seconds!</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

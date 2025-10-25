'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface VisualSearchMatch {
  id: number;
  name: string;
  price: number;
  category: string;
  barcode: string;
  match_reason: string;
  confidence: number;
}

interface VisualSearchResult {
  identified_item: string;
  matches: VisualSearchMatch[];
  search_tips?: string;
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

      if (result.matches.length > 0) {
        toast.success(`Found ${result.matches.length} similar products!`);
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

  const handleAddToCart = async (productId: number) => {
    try {
      await api.cart.addItem(productId, 1);
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
          className="fixed bottom-24 right-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
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
        <div className="fixed bottom-6 right-6 w-[480px] h-[700px] bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border-2 border-pink-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Upload Area */}
            {!previewImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-500 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-purple-500 mb-4"
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
                <p className="text-white font-semibold mb-2">Upload a Photo</p>
                <p className="text-gray-400 text-sm">
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
                  <img
                    src={previewImage}
                    alt="Search query"
                    className="w-full h-48 object-cover rounded-lg border-2 border-purple-500"
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
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                    <p className="text-white mt-4">Searching with AI...</p>
                  </div>
                )}

                {/* Identified Item */}
                {searchResults && !uploading && (
                  <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-500 rounded-lg p-4">
                    <p className="text-gray-300 text-sm mb-1">AI Identified:</p>
                    <p className="text-white font-bold text-lg">{searchResults.identified_item}</p>
                  </div>
                )}

                {/* Matches */}
                {searchResults && searchResults.matches.length > 0 && !uploading && (
                  <div>
                    <h3 className="text-white font-bold mb-3">
                      Similar Products ({searchResults.matches.length})
                    </h3>
                    <div className="space-y-3">
                      {searchResults.matches.map((match) => (
                        <div
                          key={match.id}
                          className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-purple-500 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold">{match.name}</h4>
                              <p className="text-purple-400 text-sm">{match.category}</p>
                              <p className="text-gray-400 text-xs mt-1">{match.match_reason}</p>
                            </div>
                            <span className="text-green-400 font-bold text-xl ml-2">
                              ${match.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span>{(match.confidence * 100).toFixed(0)}% match</span>
                            </div>
                            <button
                              onClick={() => handleAddToCart(match.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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
                {searchResults && searchResults.matches.length === 0 && !uploading && (
                  <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 text-center">
                    <p className="text-yellow-200 font-semibold mb-2">No exact matches found</p>
                    {searchResults.search_tips && (
                      <p className="text-yellow-300 text-sm">{searchResults.search_tips}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            {!previewImage && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-bold mb-2">How it works:</h4>
                <ul className="text-gray-300 text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">1.</span>
                    <span>Upload any photo of clothing, accessories, or home goods</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">2.</span>
                    <span>Our AI analyzes the image and identifies the items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">3.</span>
                    <span>Find similar products instantly in our inventory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">4.</span>
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

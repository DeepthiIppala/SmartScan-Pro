'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';

interface RecognizedProduct {
  product_name: string;
  confidence: number;
  category?: string;
  description?: string;
}

interface AIProductRecognitionProps {
  onProductRecognized: (productData: RecognizedProduct) => void;
}

export default function AIProductRecognition({ onProductRecognized }: AIProductRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [recognizedProduct, setRecognizedProduct] = useState<RecognizedProduct | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [searchingDatabase, setSearchingDatabase] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      console.log('Starting camera...');

      // Show camera UI first
      setShowCamera(true);

      // Wait a bit for video element to render
      await new Promise(resolve => setTimeout(resolve, 100));

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      console.log('Camera stream obtained:', mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        console.log('Camera should be visible now');
      } else {
        console.error('Video ref is null');
        setShowCamera(false);
      }
    } catch (error: any) {
      console.error('Camera error:', error);

      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application.');
      } else if (error.message?.includes('https') || error.message?.includes('secure')) {
        toast.error('Camera requires HTTPS connection. Please use https:// or localhost.');
      } else {
        toast.error('Could not access camera. Please check your browser permissions.');
      }

      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg');
        processImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const searchDatabaseForProduct = async (productName: string) => {
    setSearchingDatabase(true);
    try {
      // Get all products from database
      const allProducts = await api.products.getAll();

      // Extract keywords from AI-recognized product name
      const keywords = productName.toLowerCase().split(/[\s-]+/).filter(word => word.length > 2);

      // Search for products that match the AI-recognized name
      const matches = allProducts.filter(product => {
        const dbProductLower = product.name.toLowerCase();
        const aiProductLower = productName.toLowerCase();

        // Direct substring match
        if (dbProductLower.includes(aiProductLower) || aiProductLower.includes(dbProductLower)) {
          return true;
        }

        // Keyword matching - if product contains any significant keyword from AI result
        const keywordMatches = keywords.filter(keyword =>
          dbProductLower.includes(keyword)
        );

        // If at least one significant keyword matches, include it
        return keywordMatches.length > 0;
      });

      // Sort matches by relevance (more keyword matches = higher priority)
      const sortedMatches = matches.sort((a, b) => {
        const aMatches = keywords.filter(kw => a.name.toLowerCase().includes(kw)).length;
        const bMatches = keywords.filter(kw => b.name.toLowerCase().includes(kw)).length;
        return bMatches - aMatches;
      });

      setMatchedProducts(sortedMatches);

      if (sortedMatches.length === 0) {
        toast('Product identified but not found in database. Please add it manually or use barcode.', {
          icon: '⚠️',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Database search failed', error);
    } finally {
      setSearchingDatabase(false);
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setRecognizedProduct(null);
    setMatchedProducts([]);

    try {
      const result = await api.ai.recognizeProduct(imageData);

      if (result.confidence !== undefined && result.confidence >= 0.7 && result.product_name) {
        const recognizedData: RecognizedProduct = {
          product_name: result.product_name,
          confidence: result.confidence,
          category: result.category,
          description: result.description
        };
        setRecognizedProduct(recognizedData);
        toast.success(`AI identified: ${result.product_name}!`);
        onProductRecognized(recognizedData);

        // Search database for matching products
        await searchDatabaseForProduct(result.product_name);
      } else {
        toast.error('Could not identify product with high confidence. Please try again or use barcode scanner.');
      }
    } catch (error) {
      toast.error('AI recognition failed. Please try again.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await api.cart.addItem(product.barcode, 1);
      toast.success(`Added ${product.name} to cart!`);
      setRecognizedProduct(null);
      setMatchedProducts([]);
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error(error);
    }
  };

  const clearResults = () => {
    setRecognizedProduct(null);
    setMatchedProducts([]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Can&apos;t scan the barcode? Take a photo and let AI identify the product!
      </p>

      {!showCamera ? (
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            disabled={isProcessing}
            className="flex-1 bg-white hover:bg-gray-50 text-[#4169E1] border-2 border-[#4169E1] font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Take Photo
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 bg-white hover:bg-gray-50 text-[#4169E1] border-2 border-[#4169E1] font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg mb-3 bg-black"
            style={{ minHeight: '300px', maxHeight: '500px' }}
          />
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              disabled={isProcessing}
              className="flex-1 bg-white hover:bg-gray-50 text-[#4169E1] border-2 border-[#4169E1] font-semibold py-3 px-4 rounded-lg disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
            >
              Capture Photo
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4169E1]"></div>
          <p className="text-sm text-gray-600 mt-2">AI is analyzing the image...</p>
        </div>
      )}

      {/* AI Recognition Results */}
      {recognizedProduct && (
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-[#4169E1] rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">AI Identified:</h3>
              <p className="text-xl font-semibold text-[#4169E1]">{recognizedProduct.product_name}</p>
              <p className="text-sm text-gray-700 mt-1">
                Confidence: {(recognizedProduct.confidence * 100).toFixed(0)}%
              </p>
              {recognizedProduct.category && (
                <p className="text-sm text-gray-600">Category: {recognizedProduct.category}</p>
              )}
              {recognizedProduct.description && (
                <p className="text-sm text-gray-600 mt-1">{recognizedProduct.description}</p>
              )}
            </div>
            <button
              onClick={clearResults}
              className="text-gray-400 hover:text-gray-900 text-xl"
              title="Clear results"
            >
              ×
            </button>
          </div>

          {searchingDatabase ? (
            <div className="text-center py-3">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#4169E1]"></div>
              <p className="text-sm text-gray-600 mt-2">Searching database...</p>
            </div>
          ) : matchedProducts.length > 0 ? (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                Found {matchedProducts.length} matching product{matchedProducts.length > 1 ? 's' : ''} in database:
              </h4>
              <div className="space-y-2">
                {matchedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border-2 border-gray-200 rounded p-3 flex justify-between items-center shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">Barcode: {product.barcode}</p>
                      <p className="text-lg font-bold text-[#4169E1] mt-1">${product.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-[#4169E1] hover:bg-[#3557C1] text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded p-3 text-center">
              <p className="text-yellow-800 font-semibold">Product not found in database</p>
              <p className="text-sm text-yellow-700 mt-1">
                This product needs to be added to the database with a barcode and price first.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

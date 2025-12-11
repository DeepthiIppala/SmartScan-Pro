'use client';

import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-[#4169E1] p-6 flex flex-col h-full">
      {/* Category Badge */}
      <div className="min-h-[32px] mb-4">
        {product.category && (
          <div className="inline-block bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-1 rounded-full border border-[#4169E1]">
            <span className="text-xs font-bold text-[#4169E1]">{product.category}</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-grow mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-3">SKU: {product.barcode}</p>
        <div className="min-h-[40px]">
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          )}
        </div>
      </div>

      {/* Price and Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
        <div>
          <span className="text-3xl font-bold text-[#4169E1]">
            ${product.price.toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => onAddToCart(product)}
          className="px-6 py-3 bg-[#4169E1] text-white text-sm font-bold rounded-xl hover:bg-[#3557C1] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:ring-offset-2 shadow-lg hover:shadow-xl whitespace-nowrap"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

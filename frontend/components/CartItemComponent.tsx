'use client';

import { CartItem } from '@/lib/types';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

export default function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const itemTotal = item.product.price * item.quantity;

  // Get product image - use real image if available, otherwise generate placeholder

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-200 hover:border-[#4169E1]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{item.product.name}</h3>
          <p className="text-sm text-gray-600 mb-2">Barcode: {item.product.barcode}</p>
          <p className="text-base font-semibold text-[#4169E1]">
            ${item.product.price.toFixed(2)} each
          </p>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl px-4 py-2 border-2 border-[#4169E1] shadow-md">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="w-9 h-9 flex items-center justify-center bg-white text-[#4169E1] rounded-lg hover:bg-[#4169E1] hover:text-white transition-all shadow-sm font-bold text-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]"
            >
              −
            </button>
            <span className="w-12 text-center font-bold text-xl text-[#4169E1]">{item.quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="w-9 h-9 flex items-center justify-center bg-white text-[#4169E1] rounded-lg hover:bg-[#4169E1] hover:text-white transition-all shadow-sm font-bold text-xl focus:outline-none focus:ring-2 focus:ring-[#4169E1]"
            >
              +
            </button>
          </div>

          {/* Item Total */}
          <div className="text-left sm:text-right min-w-[120px]">
            <p className="text-xs text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-[#4169E1]">
              ${itemTotal.toFixed(2)}
            </p>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(item.id)}
            className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-2xl font-bold"
            title="Remove item"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

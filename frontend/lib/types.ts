// TypeScript types matching Flask backend models

export interface User {
  id: number;
  email: string;
  is_admin: boolean;
}

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
}

export interface TransactionItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product: Product;
}

export interface Transaction {
  id: number;
  user_id: number;
  total_amount: number;
  qr_code: string; // base64 encoded data URL
  created_at: string;
  items: TransactionItem[];
  requires_audit?: boolean;
  audit_reason?: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface AddToCartRequest {
  barcode: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

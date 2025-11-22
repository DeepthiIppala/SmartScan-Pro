// API client for Flask backend
import { User, Product, Cart, Transaction, AuthResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

// Helper function to create headers
const getHeaders = (includeAuth: boolean = false): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = false
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = getHeaders(includeAuth);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[API Error] URL:', url);
      console.error('[API Error] Status:', response.status, response.statusText);
      console.error('[API Error] Response data:', JSON.stringify(data, null, 2));
      console.error('[API Error] data.msg:', data.msg);
      console.error('[API Error] data.error:', data.error);
      console.error('[API Error] data.message:', data.message);
      throw new Error(
        data.msg || data.error || data.message || "An error occurred"
      );
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error occurred");
  }
}

// Auth API
export const authAPI = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Store token in localStorage
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }

    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // Store token in localStorage
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }

    return data;
  },

  async logout(): Promise<{ message: string }> {
    const data = await apiFetch<{ message: string }>(
      "/auth/logout",
      {
        method: "DELETE",
      },
      true
    );

    // Remove token from localStorage
    localStorage.removeItem("access_token");

    return data;
  },

  async getProfile(): Promise<User> {
    return apiFetch<User>(
      "/auth/profile",
      {
        method: "GET",
      },
      true
    );
  },
};

// Products API
export const productsAPI = {
  async getAll(): Promise<Product[]> {
    return apiFetch<Product[]>(
      "/products",
      {
        method: "GET",
      },
      true
    );
  },

  async getByBarcode(barcode: string): Promise<Product> {
    return apiFetch<Product>(
      `/products/${barcode}`,
      {
        method: "GET",
      },
      true
    );
  },

  async create(product: Omit<Product, "id">): Promise<Product> {
    return apiFetch<Product>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(product),
      },
      true
    );
  },

  async update(barcode: string, product: Partial<Product>): Promise<Product> {
    return apiFetch<Product>(
      `/products/${barcode}`,
      {
        method: "PUT",
        body: JSON.stringify(product),
      },
      true
    );
  },

  async delete(barcode: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>(
      `/products/${barcode}`,
      {
        method: "DELETE",
      },
      true
    );
  },
};

// Cart API
export const cartAPI = {
  async get(): Promise<Cart> {
    return apiFetch<Cart>(
      "/cart",
      {
        method: "GET",
      },
      true
    );
  },

  async addItem(
    barcode: string,
    quantity: number = 1
  ): Promise<{ message: string; cart: Cart }> {
    return apiFetch<{ message: string; cart: Cart }>(
      "/cart/items",
      {
        method: "POST",
        body: JSON.stringify({ barcode, quantity }),
      },
      true
    );
  },

  async updateItem(
    itemId: number,
    quantity: number
  ): Promise<{ message: string; cart: Cart }> {
    return apiFetch<{ message: string; cart: Cart }>(
      `/cart/items/${itemId}`,
      {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      },
      true
    );
  },

  async removeItem(itemId: number): Promise<{ message: string; cart: Cart }> {
    return apiFetch<{ message: string; cart: Cart }>(
      `/cart/items/${itemId}`,
      {
        method: "DELETE",
      },
      true
    );
  },
};

// Transactions API
export const transactionsAPI = {
  async checkout(): Promise<Transaction> {
    return apiFetch<Transaction>(
      "/transactions/checkout",
      {
        method: "POST",
      },
      true
    );
  },

  async getHistory(): Promise<Transaction[]> {
    return apiFetch<Transaction[]>(
      "/transactions",
      {
        method: "GET",
      },
      true
    );
  },
};

// Define types for AI responses
interface AIRecognizeResponse {
  product_name?: string;
  confidence?: number;
  category?: string;
  description?: string;
  error?: string;
}

interface AIChatResponse {
  response: string;
  timestamp: string;
}

interface AIRecommendationsResponse {
  recommendations: Product[];
}

interface FraudCheckResponse {
  is_fraud: boolean;
  confidence: number;
  reasons: string[];
}

interface VisualSearchResponse {
  products: Product[];
  matches: number;
}

// AI API
export const aiAPI = {
  async recognizeProduct(imageData: string): Promise<AIRecognizeResponse> {
    return apiFetch<AIRecognizeResponse>(
      "/ai/recognize-product",
      {
        method: "POST",
        body: JSON.stringify({ image: imageData }),
      },
      true
    );
  },

  async chat(
    message: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<AIChatResponse> {
    return apiFetch<AIChatResponse>(
      "/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({ message, history }),
      },
      true
    );
  },

  async getRecommendations(cart?: string): Promise<AIRecommendationsResponse> {
    const query = cart ? `?cart=${encodeURIComponent(cart)}` : "";
    return apiFetch<AIRecommendationsResponse>(
      `/ai/recommendations${query}`,
      {
        method: "GET",
      },
      true
    );
  },

  async checkFraud(
    scanData: unknown,
    behavior: unknown
  ): Promise<FraudCheckResponse> {
    return apiFetch<FraudCheckResponse>(
      "/ai/fraud-check",
      {
        method: "POST",
        body: JSON.stringify({ scan_data: scanData, behavior }),
      },
      true
    );
  },

  async visualSearch(imageData: string): Promise<VisualSearchResponse> {
    return apiFetch<VisualSearchResponse>(
      "/ai/visual-search",
      {
        method: "POST",
        body: JSON.stringify({ image: imageData }),
      },
      true
    );
  },
};

// Payments API
export const paymentsAPI = {
  async getConfig(): Promise<{ publishableKey: string }> {
    return apiFetch<{ publishableKey: string }>("/payments/config", {
      method: "GET",
    });
  },

  async createPaymentIntent(): Promise<{
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    status: string;
  }> {
    return apiFetch(
      "/payments/create-payment-intent",
      {
        method: "POST",
      },
      true
    );
  },

  async confirmPayment(paymentIntentId: string): Promise<{
    message: string;
    transaction_id: number;
    total_amount: number;
  }> {
    return apiFetch(
      "/payments/confirm-payment",
      {
        method: "POST",
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      },
      true
    );
  },

  async refund(transactionId: number): Promise<{
    message: string;
    refund_id: string;
    amount: number;
  }> {
    return apiFetch(
      "/payments/refund",
      {
        method: "POST",
        body: JSON.stringify({ transaction_id: transactionId }),
      },
      true
    );
  },
};

// Export all APIs as a single object
export const api = {
  auth: authAPI,
  products: productsAPI,
  cart: cartAPI,
  transactions: transactionsAPI,
  ai: aiAPI,
  payments: paymentsAPI,
};

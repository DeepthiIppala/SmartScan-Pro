'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import toast from 'react-hot-toast';

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await api.ai.getRecommendations();
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setShowRecommendations(true);
      } else {
        toast('No recommendations available yet. Shop more to get personalized suggestions!', {
          icon: '💡'
        });
      }
    } catch (error) {
      console.error('Failed to load recommendations', error);
      toast.error('Could not load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg p-6 mb-6 border border-indigo-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI-Powered Recommendations</h3>
            <p className="text-sm text-gray-300">Personalized product suggestions based on your shopping history</p>
          </div>
        </div>

        {!showRecommendations && (
          <button
            onClick={loadRecommendations}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Get Suggestions
              </>
            )}
          </button>
        )}
      </div>

      {showRecommendations && recommendations.length > 0 && (
        <div className="space-y-3 mt-4">
          {recommendations.map((product, index) => (
            <div
              key={product.id}
              className="bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-500 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{product.name}</h4>
                  <p className="text-sm text-gray-300">${product.price.toFixed(2)}</p>
                </div>
                <button className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowRecommendations(false)}
            className="w-full text-sm text-gray-300 hover:text-white py-2"
          >
            Hide Recommendations
          </button>
        </div>
      )}
    </div>
  );
}

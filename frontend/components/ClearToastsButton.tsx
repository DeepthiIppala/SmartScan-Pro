'use client';

import { dismissAllToasts } from '@/lib/toast-utils';

export default function ClearToastsButton() {
  return (
    <button
      onClick={dismissAllToasts}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
      title="Clear all notifications"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Clear Notifications
    </button>
  );
}

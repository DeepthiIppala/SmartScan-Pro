import toast from 'react-hot-toast';

/**
 * Toast utility functions for managing notifications
 */

/**
 * Dismiss all active toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Dismiss a specific toast by ID
 * @param toastId - The ID of the toast to dismiss
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Show a success toast and return its ID for later dismissal
 * @param message - The success message
 * @returns The toast ID
 */
export const showSuccess = (message: string): string => {
  return toast.success(message);
};

/**
 * Show an error toast and return its ID for later dismissal
 * @param message - The error message
 * @returns The toast ID
 */
export const showError = (message: string): string => {
  return toast.error(message);
};

/**
 * Show a loading toast and return its ID for later dismissal
 * @param message - The loading message
 * @returns The toast ID
 */
export const showLoading = (message: string): string => {
  return toast.loading(message);
};

/**
 * Update an existing toast (useful for changing loading to success/error)
 * @param toastId - The ID of the toast to update
 * @param message - The new message
 * @param type - The type of toast ('success', 'error', or 'loading')
 */
export const updateToast = (
  toastId: string,
  message: string,
  type: 'success' | 'error' | 'loading'
) => {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else if (type === 'error') {
    toast.error(message, { id: toastId });
  } else {
    toast.loading(message, { id: toastId });
  }
};

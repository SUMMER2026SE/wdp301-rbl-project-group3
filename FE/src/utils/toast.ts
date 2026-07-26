import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
  style: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#151c27',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
  },
};

export const notify = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      iconTheme: {
        primary: '#10b981', // Tailwind emerald-500
        secondary: '#fff',
      },
    });
  },
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
      iconTheme: {
        primary: '#ef4444', // Tailwind red-500
        secondary: '#fff',
      },
    });
  },
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};
/**
 * Shared frontend contract or utility used to keep client behavior consistent.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */

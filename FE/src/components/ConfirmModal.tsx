import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 p-6">
          <div className={`shrink-0 rounded-full p-3 ${
            type === 'danger' ? 'bg-error-container text-error' : 
            type === 'warning' ? 'bg-amber-100 text-amber-700' : 
            'bg-primary-container text-primary'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-on-surface">{title}</h3>
            <p className="mt-2 text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">{message}</p>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="shrink-0 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center justify-end gap-3 bg-surface-container-low px-6 py-4 border-t border-outline-variant/50">
          <button 
            type="button"
            onClick={onCancel} 
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={onConfirm} 
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition-all active:scale-95 ${
              type === 'danger' ? 'bg-error hover:bg-error/90' : 
              type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 
              'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface ToastState {
  id: string;
  type: 'info' | 'success' | 'alert';
  title?: string;
  message: string;
}

interface ToastAlertProps {
  toast: ToastState | null;
  onClose: () => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          role="alert"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur-md border border-slate-700/80 text-sm">
            {toast.type === 'alert' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}

            <div className="flex flex-col">
              {toast.title && <span className="font-semibold text-xs text-slate-200">{toast.title}</span>}
              <span className="font-medium text-slate-300">{toast.message}</span>
            </div>

            <button
              onClick={onClose}
              className="ml-2 text-xs text-slate-400 hover:text-slate-100 transition-colors p-0.5"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

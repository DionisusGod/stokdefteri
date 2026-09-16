import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, History, X, ArrowRight, Calendar } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[80vh] text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Değişiklik Geçmişi (Audit Logs)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline list */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {auditLogs.map((log, index) => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div
                key={log.id || index}
                className="relative pl-6 pb-4 last:pb-0 border-l-2 border-blue-500/40"
              >
                {/* Timeline node icon */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-2.5 h-2.5" />
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-200">
                    {log.summary || 'Kayıt Güncellendi'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span>{timeStr}</span>
                  </div>
                </div>

                {/* Diff table */}
                <div className="mt-2 space-y-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                  {log.changes && log.changes.map((change, cIdx) => (
                    <div key={cIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-400 font-medium">
                        {change.displayName || change.fieldName}:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="line-through text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-900/50">
                          {change.oldValue || '—'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-900/50">
                          {change.newValue || '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {auditLogs.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              Bu hareket için kayıtlı bir düzenleme geçmişi bulunamadı.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
};

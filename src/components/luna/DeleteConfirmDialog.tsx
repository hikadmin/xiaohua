'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  recordId: string;
  date: string;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<{ open: boolean; recordId: string; date: string }>>;
  deleteRecord: (id: string) => void;
}

export default function DeleteConfirmDialog({
  open, recordId, date, setDeleteConfirm, deleteRecord,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center px-8"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={() => setDeleteConfirm({ open: false, recordId: '', date: '' })}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full rounded-3xl p-6"
          style={{ background: '#1a2027', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <X size={24} style={{ color: '#ef4444' }} />
          </div>
          <p className="text-center text-lg font-medium mb-2">确认删除？</p>
          <p className="text-center text-sm mb-6" style={{ color: '#a8a29e' }}>
            删除后将无法恢复此条记录
          </p>
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)', color: '#f0ece4' }}
              onClick={() => setDeleteConfirm({ open: false, recordId: '', date: '' })}>
              取消
            </button>
            <button className="flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              onClick={() => deleteRecord(recordId)}>
              删除
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

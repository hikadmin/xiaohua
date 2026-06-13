'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface SymptomSheetProps {
  open: boolean;
  newSymptom: string;
  setNewSymptom: React.Dispatch<React.SetStateAction<string>>;
  setSymptomSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCustomSymptoms: React.Dispatch<React.SetStateAction<string[]>>;
  toast: (opts: { description: string }) => void;
}

export default function SymptomSheet({
  open, newSymptom, setNewSymptom, setSymptomSheetOpen, setCustomSymptoms, toast,
}: SymptomSheetProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={() => { setSymptomSheetOpen(false); setNewSymptom(''); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8"
          style={{ background: '#1a2027' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />
          <div className="text-center mb-4"><span className="font-medium">添加自定义症状</span></div>
          <div className="mb-4">
            <input type="text"
              className="w-full rounded-xl p-3 text-sm outline-none transition-all"
              style={{ background: '#232b35', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }}
              placeholder="输入症状名称..."
              value={newSymptom}
              onChange={e => setNewSymptom(e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              onKeyDown={e => {
                if (e.key === 'Enter' && newSymptom.trim()) {
                  setCustomSymptoms(prev => [...prev, newSymptom.trim()]);
                  setNewSymptom('');
                  setSymptomSheetOpen(false);
                  toast({ description: '已添加自定义症状' });
                }
              }} />
          </div>
          <motion.button
            className="w-full py-4 rounded-2xl font-medium text-lg"
            style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (newSymptom.trim()) {
                setCustomSymptoms(prev => [...prev, newSymptom.trim()]);
                setNewSymptom('');
                setSymptomSheetOpen(false);
                toast({ description: '已添加自定义症状 ✨' });
              } else {
                toast({ description: '请输入症状名称' });
              }
            }}>
            添加
          </motion.button>
          <div className="text-center py-4 cursor-pointer transition-colors"
            style={{ color: '#6b7280' }}
            onClick={() => { setSymptomSheetOpen(false); setNewSymptom(''); }}>
            取消
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

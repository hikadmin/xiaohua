'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';

interface ProfileEditSheetProps {
  open: boolean;
  editName: string;
  setEditName: React.Dispatch<React.SetStateAction<string>>;
  editAvatar: string;
  setEditAvatar: React.Dispatch<React.SetStateAction<string>>;
  editCycleLength: number;
  setEditCycleLength: React.Dispatch<React.SetStateAction<number>>;
  editPeriodLength: number;
  setEditPeriodLength: React.Dispatch<React.SetStateAction<number>>;
  setProfileEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  saveProfile: () => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function ProfileEditSheet({
  open, editName, setEditName, editAvatar, setEditAvatar,
  editCycleLength, setEditCycleLength, editPeriodLength, setEditPeriodLength,
  setProfileEditOpen, saveProfile, handleAvatarUpload, fileInputRef,
}: ProfileEditSheetProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={() => setProfileEditOpen(false)}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8"
          style={{ background: '#1a2027', maxHeight: '85vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />
          <div className="text-center mb-5"><span className="text-lg font-medium">编辑个人资料</span></div>

          {/* Avatar Upload */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: editAvatar ? 'transparent' : 'linear-gradient(135deg, #e07a5f, #81b29a)', border: '3px solid rgba(255,255,255,0.1)' }}>
                {editAvatar ? (
                  <img src={editAvatar} alt="头像预览" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>
                    {editName?.charAt(0) || 'L'}
                  </span>
                )}
              </div>
              <button
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)' }}
                onClick={() => fileInputRef.current?.click()}>
                <Camera size={16} style={{ color: '#0f1419' }} />
              </button>
              {editAvatar && (
                <button
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                  style={{ background: 'rgba(239,68,68,0.9)' }}
                  onClick={() => setEditAvatar('')}>
                  <X size={12} style={{ color: '#fff' }} />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="text-sm mb-2 block" style={{ color: '#a8a29e' }}>昵称</label>
            <input type="text"
              className="w-full rounded-xl p-3 text-sm outline-none transition-all"
              style={{ background: '#232b35', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }}
              placeholder="输入昵称..."
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
          </div>

          {/* Cycle Length */}
          <div className="mb-5">
            <label className="text-sm mb-2 block" style={{ color: '#a8a29e' }}>周期长度</label>
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setEditCycleLength(prev => Math.max(15, prev - 1))}>
                <span style={{ color: '#a8a29e', fontSize: 20 }}>-</span>
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{editCycleLength}</span>
                <span className="text-sm ml-1" style={{ color: '#a8a29e' }}>天</span>
              </div>
              <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setEditCycleLength(prev => Math.min(45, prev + 1))}>
                <span style={{ color: '#a8a29e', fontSize: 20 }}>+</span>
              </button>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[11px]" style={{ color: '#6b7280' }}>15天</span>
              <span className="text-[11px]" style={{ color: '#6b7280' }}>45天</span>
            </div>
          </div>

          {/* Period Length */}
          <div className="mb-6">
            <label className="text-sm mb-2 block" style={{ color: '#a8a29e' }}>经期长度</label>
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setEditPeriodLength(prev => Math.max(1, prev - 1))}>
                <span style={{ color: '#a8a29e', fontSize: 20 }}>-</span>
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif' }}>{editPeriodLength}</span>
                <span className="text-sm ml-1" style={{ color: '#a8a29e' }}>天</span>
              </div>
              <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setEditPeriodLength(prev => Math.min(10, prev + 1))}>
                <span style={{ color: '#a8a29e', fontSize: 20 }}>+</span>
              </button>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <span className="text-[11px]" style={{ color: '#6b7280' }}>1天</span>
              <span className="text-[11px]" style={{ color: '#6b7280' }}>10天</span>
            </div>
          </div>

          <motion.button
            className="w-full py-4 rounded-2xl font-medium text-lg"
            style={{ background: 'linear-gradient(135deg, #e07a5f, #d4a574)', color: '#0f1419' }}
            whileTap={{ scale: 0.97 }}
            onClick={saveProfile}>
            保存
          </motion.button>
          <div className="text-center py-4 cursor-pointer transition-colors"
            style={{ color: '#6b7280' }}
            onClick={() => setProfileEditOpen(false)}>
            取消
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { FEEDBACK_CATEGORIES } from './shared';

interface FeedbackSheetProps {
  open: boolean;
  feedbackCategory: string;
  setFeedbackCategory: React.Dispatch<React.SetStateAction<string>>;
  feedbackContent: string;
  setFeedbackContent: React.Dispatch<React.SetStateAction<string>>;
  feedbackContact: string;
  setFeedbackContact: React.Dispatch<React.SetStateAction<string>>;
  feedbackSubmitting: boolean;
  setFeedbackOpen: React.Dispatch<React.SetStateAction<boolean>>;
  submitFeedback: () => void;
}

export default function FeedbackSheet({
  open, feedbackCategory, setFeedbackCategory, feedbackContent,
  setFeedbackContent, feedbackContact, setFeedbackContact,
  feedbackSubmitting, setFeedbackOpen, submitFeedback,
}: FeedbackSheetProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={() => { setFeedbackOpen(false); setFeedbackContent(''); setFeedbackContact(''); }}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8"
          style={{ background: '#1a2027', maxHeight: '85dvh', overflowY: 'auto', paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="w-9 h-1 rounded-full mx-auto mb-4 opacity-50" style={{ background: '#6b7280' }} />
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(224,122,95,0.12)', border: '1px solid rgba(224,122,95,0.2)' }}>
              <MessageSquare size={24} style={{ color: '#e07a5f' }} />
            </div>
            <span className="text-lg font-medium">意见反馈</span>
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>您的每一条反馈都是我们进步的动力</p>
          </div>

          {/* Category Selection */}
          <div className="mb-5">
            <label className="text-sm mb-2.5 block" style={{ color: '#a8a29e' }}>反馈类型</label>
            <div className="flex gap-2 flex-wrap">
              {FEEDBACK_CATEGORIES.map(cat => (
                <button key={cat}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: feedbackCategory === cat ? 'rgba(224,122,95,0.15)' : '#232b35',
                    color: feedbackCategory === cat ? '#e07a5f' : '#a8a29e',
                    border: feedbackCategory === cat ? '1px solid rgba(224,122,95,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                  onClick={() => setFeedbackCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-5">
            <label className="text-sm mb-2.5 block" style={{ color: '#a8a29e' }}>反馈内容</label>
            <textarea
              className="w-full rounded-xl p-3 text-sm outline-none transition-all resize-none"
              style={{ background: '#232b35', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4', minHeight: '120px' }}
              placeholder="请详细描述您的建议或遇到的问题..."
              value={feedbackContent}
              onChange={e => setFeedbackContent(e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[11px]" style={{ color: feedbackContent.length > 500 ? '#ef4444' : '#6b7280' }}>
                {feedbackContent.length}/500
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-6">
            <label className="text-sm mb-2.5 block" style={{ color: '#a8a29e' }}>联系方式 <span style={{ color: '#6b7280' }}>(选填)</span></label>
            <input type="text"
              className="w-full rounded-xl p-3 text-sm outline-none transition-all"
              style={{ background: '#232b35', border: '1.5px solid rgba(255,255,255,0.06)', color: '#f0ece4' }}
              placeholder="邮箱或手机号，方便我们联系您"
              value={feedbackContact}
              onChange={e => setFeedbackContact(e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = '#d4a57440'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
            />
          </div>

          <motion.button
            className="w-full py-4 rounded-2xl font-medium text-lg flex items-center justify-center gap-2"
            style={{
              background: feedbackSubmitting ? '#232b35' : 'linear-gradient(135deg, #e07a5f, #d4a574)',
              color: feedbackSubmitting ? '#a8a29e' : '#0f1419',
            }}
            whileTap={{ scale: 0.97 }}
            disabled={feedbackSubmitting}
            onClick={submitFeedback}>
            {feedbackSubmitting ? (
              <motion.div
                className="w-5 h-5 border-2 rounded-full"
                style={{ borderColor: '#a8a29e', borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <Send size={18} />
                <span>提交反馈</span>
              </>
            )}
          </motion.button>
          <div className="text-center py-4 cursor-pointer transition-colors"
            style={{ color: '#6b7280' }}
            onClick={() => { setFeedbackOpen(false); setFeedbackContent(''); setFeedbackContact(''); }}>
            取消
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

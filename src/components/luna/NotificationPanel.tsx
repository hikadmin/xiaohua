'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Heart, Trash2, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// ============ Notification Types ============
export type NotificationType = 'period' | 'record' | 'ovulation';

export interface LunaNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number; // ms since epoch
}

// ============ Relative Time Helper ============
function getRelativeTime(timestamp: number, t: (key: string) => string): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 2) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}月前`;
}

// ============ Notification Icon Helper ============
function getNotifIcon(type: NotificationType) {
  switch (type) {
    case 'period':
      return <Calendar size={18} style={{ color: '#e07a5f' }} />;
    case 'record':
      return <Bell size={18} style={{ color: '#81b29a' }} />;
    case 'ovulation':
      return <Heart size={18} style={{ color: '#d4a574' }} />;
    default:
      return <Bell size={18} style={{ color: '#a8a29e' }} />;
  }
}

function getNotifIconBg(type: NotificationType) {
  switch (type) {
    case 'period':
      return 'rgba(224,122,95,0.12)';
    case 'record':
      return 'rgba(129,178,154,0.12)';
    case 'ovulation':
      return 'rgba(212,165,116,0.12)';
    default:
      return 'rgba(168,162,158,0.12)';
  }
}

// ============ Notification Item Component ============
function NotificationItem({
  notification,
  onDelete,
  t,
}: {
  notification: LunaNotification;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const [swiped, setSwiped] = React.useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0, padding: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl"
      style={{ marginBottom: 8 }}
    >
      {/* Delete background (revealed on swipe) */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-4 rounded-2xl"
        style={{ background: 'rgba(239,68,68,0.15)' }}
      >
        <button
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
          onClick={() => onDelete(notification.id)}
        >
          {t('notif_delete')}
        </button>
      </div>

      {/* Main content (swipeable) */}
      <motion.div
        className="relative flex items-center gap-3 p-4 rounded-2xl"
        style={{
          background: '#232b35',
          border: '1px solid rgba(255,255,255,0.06)',
          x: swiped ? -80 : 0,
        }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -40) {
            setSwiped(true);
          } else {
            setSwiped(false);
          }
        }}
        onClick={() => setSwiped(false)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: getNotifIconBg(notification.type) }}
        >
          {getNotifIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#f0ece4' }}>
            {notification.title}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#a8a29e' }}>
            {notification.message}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            {getRelativeTime(notification.timestamp, t)}
          </span>
          <button
            className="p-1 rounded-lg transition-all hover:scale-110 active:scale-95"
            style={{ background: 'rgba(239,68,68,0.08)' }}
            onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
          >
            <Trash2 size={12} style={{ color: '#ef4444' }} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ Notification Panel Props ============
interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: LunaNotification[];
  onDeleteNotification: (id: string) => void;
  onDeleteAll: () => void;
}

// ============ Notification Panel Component ============
export default function NotificationPanel({
  open, onClose, notifications, onDeleteNotification, onDeleteAll,
}: NotificationPanelProps) {
  const { t } = useI18n();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
            style={{ background: '#1a2027', maxHeight: '75vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-2 opacity-50" style={{ background: '#6b7280' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <h2 className="text-lg font-medium" style={{ color: '#f0ece4' }}>
                {t('notif_title')}
              </h2>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <motion.button
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onDeleteAll}
                  >
                    {t('notif_clear_all')}
                  </motion.button>
                )}
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  onClick={onClose}
                >
                  <X size={16} style={{ color: '#a8a29e' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ minHeight: 200 }}>
              {notifications.length === 0 ? (
                /* Empty State */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(168,162,158,0.08)' }}
                  >
                    <Bell size={28} style={{ color: '#6b7280' }} />
                  </div>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    {t('notif_empty')}
                  </p>
                </motion.div>
              ) : (
                /* Notification List */
                <div className="space-y-0">
                  <AnimatePresence>
                    {notifications.map(notif => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onDelete={onDeleteNotification}
                        t={t}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

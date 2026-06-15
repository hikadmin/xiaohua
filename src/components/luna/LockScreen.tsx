'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import PinPad from './PinPad';
import {
  verifyPin, recordFailedAttempt, resetFailedAttempts,
  getLockoutRemaining, getRemainingAttempts, formatLockoutTime, isPinSet,
} from '@/lib/lock-utils';

interface LockScreenProps {
  /** Theme accent color */
  themeColor: string;
  /** Called when the user successfully unlocks */
  onUnlock: () => void;
}

export default function LockScreen({ themeColor, onUnlock }: LockScreenProps) {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [lockoutRemaining, setLockoutRemaining] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return getLockoutRemaining();
  });
  const [remainingAttempts, setRemainingAttempts] = useState(() => {
    if (typeof window === 'undefined') return MAX_ATTEMPTS;
    return getRemainingAttempts();
  });

  // Lockout countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const r = getLockoutRemaining();
      setLockoutRemaining(r);
      if (r <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDigit = useCallback(async (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      const isValid = await verifyPin(newPin);
      if (isValid) {
        resetFailedAttempts();
        onUnlock();
      } else {
        const attempts = recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - attempts;
        setRemainingAttempts(Math.max(0, remaining));
        setShake(true);

        if (remaining <= 0) {
          // Trigger lockout
          const lockout = getLockoutRemaining();
          setLockoutRemaining(lockout);
          setError(t('lock_too_many_attempts'));
        } else {
          setError(t('lock_wrong_pin_remaining').replace('{0}', String(remaining)));
        }

        setTimeout(() => {
          setShake(false);
          setPin('');
        }, 600);
      }
    }
  }, [pin, lockoutRemaining, onUnlock, t]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const isLocked = lockoutRemaining > 0;

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex flex-col items-center justify-center px-6"
      style={{ background: '#0f1419' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Luna Logo */}
      <motion.div
        className="text-center mb-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${themeColor}, #81b29a)` }}
        >
          <span className="text-3xl font-light" style={{ fontFamily: 'Georgia, serif', color: '#0f1419' }}>L</span>
        </div>
        <p className="text-xl font-light mb-1" style={{ fontFamily: 'Georgia, serif', color: '#f0ece4' }}>Luna</p>
        <p className="text-sm" style={{ color: '#6b7280' }}>
          {isLocked ? t('lock_locked_out') : t('lock_enter_pin')}
        </p>
      </motion.div>

      {/* Error message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            className="text-xs mb-4 text-center"
            style={{ color: '#ef4444' }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Lockout countdown */}
      {isLocked && (
        <div className="text-center mb-6">
          <p className="text-2xl font-mono font-bold" style={{ color: themeColor }}>
            {formatLockoutTime(lockoutRemaining)}
          </p>
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{t('lock_try_again_later')}</p>
        </div>
      )}

      {/* PIN Pad */}
      <PinPad
        pinLength={pin.length}
        onDigit={handleDigit}
        onDelete={handleDelete}
        accentColor={themeColor}
        disabled={isLocked}
        shake={shake}
      />

      {/* Remaining attempts hint */}
      {!isLocked && remainingAttempts < MAX_ATTEMPTS && remainingAttempts > 0 && (
        <p className="text-xs mt-6" style={{ color: '#6b7280' }}>
          {t('lock_attempts_remaining').replace('{0}', String(remainingAttempts))}
        </p>
      )}

      {/* Unlock hint */}
      {!isLocked && remainingAttempts === MAX_ATTEMPTS && (
        <p className="text-xs mt-6" style={{ color: '#6b7280' }}>{t('lock_unlock')}</p>
      )}
    </motion.div>
  );
}

// Re-export constant for use in other components
const MAX_ATTEMPTS = 5;

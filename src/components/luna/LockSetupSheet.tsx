'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, AlertTriangle, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import PinPad from './PinPad';
import { savePin, removePin, isPinSet, verifyPin, resetFailedAttempts } from '@/lib/lock-utils';

type PinStep = 'set' | 'confirm' | 'verify_old' | 'manage';

interface LockSetupSheetProps {
  open: boolean;
  onClose: () => void;
  /** Current app_lock setting value from DB */
  isLockEnabled: boolean;
  /** Toggle the app_lock setting in DB */
  toggleAppLock: (currentValue: string) => void;
  /** Theme accent color */
  themeColor: string;
}

export default function LockSetupSheet({
  open, onClose, isLockEnabled, toggleAppLock, themeColor,
}: LockSetupSheetProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [pinStep, setPinStep] = useState<PinStep>(isLockEnabled ? 'manage' : 'set');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');

  const resetState = useCallback(() => {
    setPin('');
    setFirstPin('');
    setPinStep(isLockEnabled ? 'manage' : 'set');
    setShake(false);
    setError('');
  }, [isLockEnabled]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleDigit = useCallback(async (digit: string) => {
    if (pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      switch (pinStep) {
        case 'set': {
          // First PIN entry — store and move to confirm
          setFirstPin(newPin);
          setPin('');
          setPinStep('confirm');
          break;
        }
        case 'confirm': {
          // Second PIN entry — verify match
          if (newPin === firstPin) {
            await savePin(newPin);
            toggleAppLock('false'); // flip false→true
            resetFailedAttempts();
            toast({ description: t('lock_pin_set') });
            setPinStep('manage');
            setPin('');
            setFirstPin('');
          } else {
            setShake(true);
            setError(t('lock_pin_mismatch'));
            setTimeout(() => {
              setShake(false);
              setPin('');
              setFirstPin('');
              setPinStep('set');
            }, 600);
          }
          break;
        }
        case 'verify_old': {
          // Verify old PIN before changing
          const isValid = await verifyPin(newPin);
          if (isValid) {
            setPin('');
            setPinStep('set');
          } else {
            setShake(true);
            setError(t('lock_wrong_pin'));
            setTimeout(() => {
              setShake(false);
              setPin('');
            }, 600);
          }
          break;
        }
        default:
          break;
      }
    }
  }, [pin, pinStep, firstPin, toggleAppLock, toast, t]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleChangePin = useCallback(() => {
    setPin('');
    setError('');
    setPinStep('verify_old');
  }, []);

  const handleTurnOff = useCallback(async () => {
    removePin();
    toggleAppLock('true'); // flip true→false
    toast({ description: t('lock_disabled') });
    handleClose();
  }, [toggleAppLock, toast, t, handleClose]);

  if (!open) return null;

  // Get step description
  const getStepDescription = () => {
    switch (pinStep) {
      case 'set': return t('lock_set_pin');
      case 'confirm': return t('lock_confirm_pin');
      case 'verify_old': return t('lock_enter_old_pin');
      default: return '';
    }
  };

  const showPinPad = pinStep !== 'manage';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div
            className="relative w-full max-w-md rounded-t-[24px] p-6 overflow-y-auto"
            style={{ background: '#1a2027', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90dvh', paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}08)` }}>
                <Shield size={24} style={{ color: themeColor }} />
              </div>
              <div>
                <p className="text-lg font-medium">{t('lock_title')}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  {isLockEnabled ? t('lock_status_enabled') : t('lock_status_disabled')}
                </p>
              </div>
            </div>

            {/* Manage view — when lock is enabled */}
            {pinStep === 'manage' && isLockEnabled && (
              <div className="space-y-3">
                {/* Lock status card */}
                <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: `${themeColor}12`, border: `1px solid ${themeColor}25` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${themeColor}20` }}>
                    <Lock size={20} style={{ color: themeColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('lock_enabled_title')}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{t('lock_enabled_desc')}</p>
                  </div>
                  <Check size={18} style={{ color: '#81b29a' }} />
                </div>

                {/* Change PIN button */}
                <button
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl active:scale-[0.98] transition-all"
                  style={{ background: '#232b35', border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={handleChangePin}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1a2027' }}>
                    <Lock size={18} style={{ color: '#d4a574' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{t('lock_change_pin')}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{t('lock_change_pin_desc')}</p>
                  </div>
                </button>

                {/* Turn off lock button */}
                <button
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl active:scale-[0.98] transition-all"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                  onClick={handleTurnOff}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <Unlock size={18} style={{ color: '#ef4444' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium" style={{ color: '#ef4444' }}>{t('lock_turn_off')}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{t('lock_turn_off_desc')}</p>
                  </div>
                </button>
              </div>
            )}

            {/* PIN entry view — for set/confirm/verify_old */}
            {showPinPad && (
              <div>
                {/* Step indicator */}
                <div className="text-center mb-2">
                  <p className="text-sm" style={{ color: '#a8a29e' }}>{getStepDescription()}</p>
                </div>

                {/* Step dots for set → confirm flow */}
                {pinStep !== 'verify_old' && (
                  <div className="flex justify-center gap-2 mb-4">
                    <div className="w-8 h-1.5 rounded-full transition-all" style={{ background: pinStep === 'set' ? themeColor : '#232b35' }} />
                    <div className="w-8 h-1.5 rounded-full transition-all" style={{ background: pinStep === 'confirm' ? themeColor : '#232b35' }} />
                  </div>
                )}

                {/* Error message */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.p
                      key={error}
                      className="text-xs mb-3 text-center"
                      style={{ color: '#ef4444' }}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* PIN Pad */}
                <PinPad
                  pinLength={pin.length}
                  onDigit={handleDigit}
                  onDelete={handleDelete}
                  accentColor={themeColor}
                  shake={shake}
                />

                {/* Cancel button for verify_old step */}
                {pinStep === 'verify_old' && (
                  <button
                    className="w-full mt-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: '#232b35', color: '#6b7280' }}
                    onClick={() => { setPinStep('manage'); setPin(''); setError(''); }}
                  >
                    {t('log_cancel')}
                  </button>
                )}
              </div>
            )}

            {/* Security note */}
            <div className="mt-5 flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(129,178,154,0.06)', border: '1px solid rgba(129,178,154,0.1)' }}>
              <AlertTriangle size={14} style={{ color: '#81b29a', marginTop: 1, flexShrink: 0 }} />
              <p className="text-[11px] leading-relaxed" style={{ color: '#6b7280' }}>{t('lock_security_note')}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

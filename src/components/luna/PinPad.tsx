'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface PinPadProps {
  /** Current PIN value (for dot display) */
  pinLength: number;
  /** Max PIN length */
  maxLength?: number;
  /** Callback when a digit is pressed */
  onDigit: (digit: string) => void;
  /** Callback when delete/backspace is pressed */
  onDelete: () => void;
  /** Accent color for filled dots */
  accentColor?: string;
  /** Whether the pad is disabled (e.g., during lockout) */
  disabled?: boolean;
  /** Whether to show Biometric button (bottom-left) */
  showBiometric?: boolean;
  /** Biometric button click handler */
  onBiometric?: () => void;
  /** Biometric icon */
  biometricIcon?: React.ReactNode;
  /** Shake animation trigger */
  shake?: boolean;
}

export default function PinPad({
  pinLength,
  maxLength = 4,
  onDigit,
  onDelete,
  accentColor = '#e07a5f',
  disabled = false,
  showBiometric = false,
  onBiometric,
  biometricIcon,
  shake = false,
}: PinPadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-[280px] mx-auto">
      {/* PIN Dots */}
      <motion.div
        className="flex justify-center gap-5 mb-8"
        animate={shake ? { x: [0, -10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className="w-[14px] h-[14px] rounded-full transition-all duration-200"
            style={{
              background: i < pinLength ? accentColor : 'rgba(255,255,255,0.1)',
              boxShadow: i < pinLength ? `0 0 8px ${accentColor}60` : 'none',
              transform: i < pinLength ? 'scale(1.1)' : 'scale(1)',
            }}
          />
        ))}
      </motion.div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map(d => (
          <button
            key={d}
            className="h-[56px] rounded-2xl text-xl font-medium active:scale-95 transition-all duration-100 flex items-center justify-center"
            style={{
              background: '#232b35',
              color: disabled ? '#4b5563' : '#f0ece4',
              opacity: disabled ? 0.5 : 1,
            }}
            disabled={disabled}
            onClick={() => !disabled && onDigit(d)}
          >
            {d}
          </button>
        ))}

        {/* Bottom row: Biometric | 0 | Delete */}
        {showBiometric ? (
          <button
            className="h-[56px] rounded-2xl text-xl font-medium active:scale-95 transition-all duration-100 flex items-center justify-center"
            style={{ background: '#232b35', color: '#81b29a' }}
            onClick={onBiometric}
          >
            {biometricIcon || (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                <path d="M12 2a8 8 0 0 0-8 8c0 4 3 7 5 9.5a1 1 0 0 0 1.5 0C12.5 17 20 13 20 10a8 8 0 0 0-8-8z" />
              </svg>
            )}
          </button>
        ) : (
          <div />
        )}

        <button
          className="h-[56px] rounded-2xl text-xl font-medium active:scale-95 transition-all duration-100 flex items-center justify-center"
          style={{
            background: '#232b35',
            color: disabled ? '#4b5563' : '#f0ece4',
            opacity: disabled ? 0.5 : 1,
          }}
          disabled={disabled}
          onClick={() => !disabled && onDigit('0')}
        >
          0
        </button>

        <button
          className="h-[56px] rounded-2xl text-lg font-medium active:scale-95 transition-all duration-100 flex items-center justify-center"
          style={{
            background: '#232b35',
            color: disabled ? '#4b5563' : '#6b7280',
            opacity: disabled ? 0.5 : 1,
          }}
          disabled={disabled}
          onClick={() => !disabled && onDelete()}
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}

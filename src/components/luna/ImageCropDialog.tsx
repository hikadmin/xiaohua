'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onCancel: () => void;
  cropShape?: 'round' | 'rect';
  aspectRatio?: number;
}

/**
 * Creates a cropped image using canvas.
 * Returns base64 data URL of the cropped region, compressed to maxOutputSize.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  maxOutputSize = 512
): Promise<string> {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Calculate output size, preserving aspect ratio within maxOutputSize
  let outputWidth = pixelCrop.width;
  let outputHeight = pixelCrop.height;
  if (outputWidth > maxOutputSize || outputHeight > maxOutputSize) {
    const scale = maxOutputSize / Math.max(outputWidth, outputHeight);
    outputWidth = Math.round(outputWidth * scale);
    outputHeight = Math.round(outputHeight * scale);
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}

export default function ImageCropDialog({
  open,
  imageSrc,
  onCropComplete,
  onCancel,
  cropShape = 'round',
  aspectRatio = 1,
}: ImageCropDialogProps) {
  const { t } = useI18n();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, 512);
      onCropComplete(croppedBase64);
    } catch (err) {
      console.error('Crop failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete]);

  const handleCancel = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onCancel();
  }, [onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[250] flex flex-col"
          style={{ background: '#1a2027' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-top" style={{ background: '#1a2027' }}>
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ color: '#a8a29e' }}
            >
              {t('crop_cancel')}
            </button>
            <span className="text-base font-medium" style={{ color: '#f0ece4' }}>
              {t('crop_title')}
            </span>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #e07a5f, #d4a574)',
                color: '#0f1419',
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              {isProcessing ? '...' : t('crop_confirm')}
            </button>
          </div>

          {/* Cropper Area */}
          <div className="relative flex-1" style={{ background: '#0f1419' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              cropShape={cropShape}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={handleCropComplete}
              showGrid={false}
              style={{
                containerStyle: {
                  background: '#0f1419',
                },
              }}
            />
          </div>

          {/* Zoom Slider */}
          <div className="px-6 py-5" style={{ background: '#1a2027' }}>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: '#6b7280' }}>
                -
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #e07a5f ${(zoom - 1) / 2 * 100}%, #2a3441 ${(zoom - 1) / 2 * 100}%)`,
                }}
              />
              <span className="text-xs" style={{ color: '#6b7280' }}>
                +
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedImageDataUrl: string) => void;
  aspectRatio?: number; // width/height ratio, undefined = free form
  title?: string;
  circularCrop?: boolean;
  themeColor: string;
}

export default function ImageCropper({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio,
  title = '裁剪图片',
  circularCrop = false,
  themeColor,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (aspectRatio) {
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 80,
          },
          aspectRatio,
          width,
          height,
        ),
        width,
        height,
      );
      setCrop(crop);
    } else {
      // Default: select 80% of the image
      setCrop({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80,
      });
    }
  }

  const handleCropComplete = useCallback(() => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate the actual crop position considering scale and rotation
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Limit output size to prevent huge canvases
    const maxOutputSize = 1024;
    let outputWidth = cropWidth;
    let outputHeight = cropHeight;
    if (outputWidth > maxOutputSize || outputHeight > maxOutputSize) {
      const ratio = Math.min(maxOutputSize / outputWidth, maxOutputSize / outputHeight);
      outputWidth *= ratio;
      outputHeight *= ratio;
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Apply rotation
    const rotateRads = (rotate * Math.PI) / 180;
    ctx.save();
    if (rotate !== 0) {
      ctx.translate(outputWidth / 2, outputHeight / 2);
      ctx.rotate(rotateRads);
      ctx.translate(-outputWidth / 2, -outputHeight / 2);
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    ctx.restore();

    // For circular crop (avatar), clip to circle
    if (circularCrop) {
      const circleCanvas = document.createElement('canvas');
      const circleCtx = circleCanvas.getContext('2d');
      if (!circleCtx) return;

      const size = Math.min(outputWidth, outputHeight);
      circleCanvas.width = size;
      circleCanvas.height = size;

      circleCtx.beginPath();
      circleCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      circleCtx.closePath();
      circleCtx.clip();

      const offsetX = (size - outputWidth) / 2;
      const offsetY = (size - outputHeight) / 2;
      circleCtx.drawImage(canvas, offsetX, offsetY);

      const dataUrl = circleCanvas.toDataURL('image/png', 0.9);
      onCropComplete(dataUrl);
    } else {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCropComplete(dataUrl);
    }

    onClose();
  }, [completedCrop, rotate, circularCrop, onCropComplete, onClose]);

  const handleReset = () => {
    setScale(1);
    setRotate(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  if (!open || !imageSrc) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex flex-col"
        style={{ background: '#0f1419' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onClick={onClose}
          >
            <X size={20} style={{ color: '#a8a29e' }} />
          </button>
          <span className="text-base font-medium">{title}</span>
          <button
            className="px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`, color: '#0f1419' }}
            onClick={handleCropComplete}
          >
            <Check size={16} strokeWidth={2.5} />
            <span className="text-sm font-medium">确认</span>
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4"
          style={{ background: '#0a0e12' }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            circularCrop={circularCrop}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="裁剪图片"
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                maxWidth: '100%',
                maxHeight: '60vh',
                display: 'block',
              }}
              onLoad={onImageLoad}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        {/* Toolbar */}
        <div className="flex-shrink-0 px-4 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0f1419' }}>
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            >
              <ZoomOut size={18} style={{ color: '#a8a29e' }} />
            </button>
            <span className="text-sm w-16 text-center" style={{ color: '#a8a29e' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setScale(s => Math.min(3, s + 0.1))}
            >
              <ZoomIn size={18} style={{ color: '#a8a29e' }} />
            </button>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setRotate(r => (r + 90) % 360)}
            >
              <RotateCcw size={18} style={{ color: '#a8a29e' }} />
            </button>
            <button
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onClick={handleReset}
            >
              <Move size={18} style={{ color: '#a8a29e' }} />
            </button>
          </div>

          {/* Hint */}
          <p className="text-center text-xs" style={{ color: '#6b7280' }}>
            拖动选框选择区域，缩放和旋转调整图片
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Plus, Upload, X } from 'lucide-react';
import { HapticTap } from '@/components/haptic-tap';

const assistImageStorageKey = 'relay-assist-image';

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to convert image to data URL.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function FloatingAction() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [routing, setRouting] = useState(false);

  async function handleFileSelection(file: File | null, source: 'camera' | 'upload') {
    if (!file) {
      return;
    }

    setRouting(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      sessionStorage.setItem(
        assistImageStorageKey,
        JSON.stringify({
          dataUrl,
          name: file.name,
          source,
          savedAt: Date.now(),
        }),
      );
      router.push(`/sell?source=${source}`);
    } finally {
      setExpanded(false);
      setRouting(false);
    }
  }

  return (
    <div className="fixed bottom-28 right-6 z-20 md:right-[max(1.5rem,calc(50vw-12rem))]">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void handleFileSelection(event.target.files?.[0] ?? null, 'camera');
          event.currentTarget.value = '';
        }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFileSelection(event.target.files?.[0] ?? null, 'upload');
          event.currentTarget.value = '';
        }}
      />

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="paper-panel absolute bottom-20 right-0 w-[156px] p-3"
          >
            <HapticTap
              onClick={() => cameraInputRef.current?.click()}
              disabled={routing}
              className="chrome-button-primary flex h-12 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] text-paper disabled:opacity-50"
            >
              <Camera size={14} />
              拍照
            </HapticTap>
            <HapticTap
              onClick={() => uploadInputRef.current?.click()}
              disabled={routing}
              className="chrome-button mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-[0.24em] disabled:opacity-50"
            >
              <Upload size={14} />
              上传
            </HapticTap>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <HapticTap
        aria-label={expanded ? '关闭上架快捷入口' : '打开上架快捷入口'}
        onClick={() => setExpanded((current) => !current)}
        className="chrome-button flex h-16 w-16 items-center justify-center rounded-full"
      >
        {expanded ? (
          <X size={24} strokeWidth={1.7} className="text-ink" />
        ) : (
          <Plus size={28} strokeWidth={1.5} className="text-ink" />
        )}
      </HapticTap>
    </div>
  );
}

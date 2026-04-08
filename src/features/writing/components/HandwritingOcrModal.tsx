'use client';

/**
 * @author SaltedFish-No1
 * @description 手写作文 OCR 弹窗组件，支持拍照或上传手写内容并识别为文字。
 */
import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, X, PenLine, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { recognizeHandwriting } from '@/features/writing/lib/writingApi';

interface HandwritingOcrModalProps {
  open: boolean;
  onClose: () => void;
  onFillText: (text: string) => void;
  hasExistingText: boolean;
}

export function HandwritingOcrModal({
  open,
  onClose,
  onFillText,
  hasExistingText,
}: HandwritingOcrModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setRecognizing(false);
    setError(null);
    setExtractedText(null);
  }, []);

  function handleClose() {
    if (recognizing) return;
    reset();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setError(null);
    setExtractedText(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleRecognize() {
    if (!imageFile) return;
    setRecognizing(true);
    setError(null);
    try {
      const text = await recognizeHandwriting(imageFile);
      if (!text.trim()) {
        setError('未识别到任何英文文本，请尝试更清晰的图片');
        return;
      }
      setExtractedText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败');
    } finally {
      setRecognizing(false);
    }
  }

  function handleFill() {
    if (extractedText) {
      onFillText(extractedText);
      reset();
    }
  }

  function handleRetry() {
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setExtractedText(null);
  }

  const hasResult = extractedText !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) =>
            !recognizing && e.target === e.currentTarget && handleClose()
          }
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] shadow-2xl sm:rounded-3xl sm:pb-6"
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {hasResult ? '识别结果' : '手写识别'}
              </h2>
              <button
                onClick={handleClose}
                disabled={recognizing}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            {hasResult ? (
              /* Preview extracted text */
              <>
                <div className="mb-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                    {extractedText}
                  </p>
                </div>
                {hasExistingText && (
                  <p className="mb-3 text-center text-xs text-amber-600">
                    当前编辑器中的内容将被替换
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                  >
                    <RotateCcw size={16} />
                    重新拍照
                  </button>
                  <button
                    onClick={handleFill}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700"
                  >
                    <PenLine size={16} />
                    填入编辑器
                  </button>
                </div>
              </>
            ) : (
              /* Upload + Recognize */
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {imagePreview ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 w-full bg-slate-50 object-contain"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          setError(null);
                        }}
                        disabled={recognizing}
                        className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="upload-area"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-4 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400 transition-colors hover:border-violet-300 hover:text-violet-500"
                    >
                      <div className="flex gap-2">
                        <Camera size={24} />
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-medium">
                        拍照或选择手写作文图片
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="mb-3 text-center text-sm text-red-500">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleRecognize}
                  disabled={!imageFile || recognizing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
                >
                  {recognizing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      AI 识别中...
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      识别文字
                    </>
                  )}
                </button>
              </>
            )}

            {recognizing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-t-3xl bg-white/70 backdrop-blur-[1px] sm:rounded-3xl">
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow">
                  <Loader2 size={16} className="animate-spin" />
                  AI 识别中...
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

/**
 * @author SaltedFish-No1
 * @description 拍照识词弹窗组件，支持拍照或上传图片，通过视觉模型提取英文单词。
 */
import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, X, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { extractWordsFromPhoto } from '@/features/photo-capture/lib/photoCaptureApi';
import { PHOTO_CAPTURE_PREFIX } from '@/lib/photo-capture';
import { useUserStore } from '@/store/useUserStore';
import type { ExtractedWord } from '@/features/photo-capture/types';
import { Button } from '@/components/ui/button';

interface PhotoCaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export function PhotoCaptureModal({ open, onClose }: PhotoCaptureModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedWords, setExtractedWords] = useState<ExtractedWord[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set()
  );
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setIsExtracting(false);
    setExtractedWords([]);
    setSelectedIndices(new Set());
    setIsSaved(false);
  }, []);

  function handleClose() {
    if (isExtracting) return;
    reset();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setExtractedWords([]);
    setIsSaved(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleExtract() {
    if (!imageFile) return;
    setIsExtracting(true);
    try {
      const words = await extractWordsFromPhoto(imageFile);
      if (words.length === 0) {
        toast.error('未识别到任何英文单词，请尝试更清晰的图片');
        return;
      }
      setExtractedWords(words);
      setSelectedIndices(new Set(words.map((_, i) => i)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '识别失败');
    } finally {
      setIsExtracting(false);
    }
  }

  function toggleWord(index: number) {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function handleSave() {
    const store = useUserStore.getState();
    const batchSlug = `${PHOTO_CAPTURE_PREFIX}${Date.now()}`;
    const dateLabel = '拍照识词';

    for (const index of selectedIndices) {
      const w = extractedWords[index];
      store.upsertVocabOccurrence({
        word: w.word,
        lessonSlug: batchSlug,
        lessonTitle: dateLabel,
        paragraphIndex: index,
        surface: w.word,
        senseSnapshot: {
          headword: w.word,
          pos: w.pos ?? undefined,
          def: w.definition ?? undefined,
        },
      });
      // Background: enrich with dictionary data (phonetics, audio)
      void store.fetchDictionaryRecord(w.word);
    }

    setIsSaved(true);
    toast.success('已保存到词汇本');
  }

  // Phase detection
  const hasExtracted = extractedWords.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-md sm:items-center"
          onClick={(e) =>
            !isExtracting && e.target === e.currentTarget && handleClose()
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
                {isSaved ? '保存成功' : hasExtracted ? '识别结果' : '拍照识词'}
              </h2>
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isExtracting}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Success State */}
            {isSaved ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">
                  已将 {selectedIndices.size} 个单词保存到生词本
                </p>
                <Button
                  onClick={handleClose}
                  className="mt-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                >
                  完成
                </Button>
              </div>
            ) : hasExtracted ? (
              /* Phase 3: Review & Save */
              <>
                <p className="mb-3 text-xs text-slate-500">
                  共识别 {extractedWords.length} 个单词，取消勾选不需要的单词
                </p>
                <div className="mb-4 max-h-72 space-y-2 overflow-y-auto">
                  {extractedWords.map((w, i) => (
                    <Button
                      key={`${w.word}-${i}`}
                      variant="ghost"
                      type="button"
                      onClick={() => toggleWord(i)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                        selectedIndices.has(i)
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-100 bg-slate-50 opacity-50'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          selectedIndices.has(i)
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedIndices.has(i) && <Check size={12} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {w.word}
                          </span>
                          {w.pos && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              {w.pos}
                            </span>
                          )}
                        </div>
                        {w.definition && (
                          <p className="mt-0.5 text-xs text-slate-600">
                            {w.definition}
                          </p>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleSave}
                  disabled={selectedIndices.size === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none"
                >
                  <Check size={18} />
                  保存 {selectedIndices.size} 个单词到生词本
                </Button>
              </>
            ) : (
              /* Phase 1 & 2: Upload + Extract */
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
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        disabled={isExtracting}
                        className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X size={14} />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="upload-area"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="mb-4 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400 transition-colors hover:border-emerald-300 hover:text-emerald-500"
                    >
                      <div className="flex gap-2">
                        <Camera size={24} />
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-medium">
                        拍照或选择手抄单词图片
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleExtract}
                  disabled={!imageFile || isExtracting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:shadow-none"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      AI 识别中...
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      识别单词
                    </>
                  )}
                </Button>
              </>
            )}
            {isExtracting && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-t-3xl bg-white/70 backdrop-blur-md sm:rounded-3xl">
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

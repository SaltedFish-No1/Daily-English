'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Loader2,
  X,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  uploadTopic,
  createTopicManual,
  fetchCriteria,
} from '@/features/writing/lib/writingApi';
import type { GradingCriteria, WritingTopic } from '@/types/writing';
import { useEffect } from 'react';

type InputMode = 'image' | 'manual';

interface TopicUploaderProps {
  onTopicCreated: (topic: WritingTopic) => void;
  onClose: () => void;
}

export function TopicUploader({ onTopicCreated, onClose }: TopicUploaderProps) {
  const [criteria, setCriteria] = useState<GradingCriteria[]>([]);
  const [criteriaLoading, setCriteriaLoading] = useState(true);
  const [selectedCriteria, setSelectedCriteria] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualPrompt, setManualPrompt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCriteria()
      .then((list) => {
        setCriteria(list);
        if (list.length > 0) setSelectedCriteria(list[0].id);
      })
      .catch(() => {
        setError('评分标准加载失败，请刷新重试');
      })
      .finally(() => {
        setCriteriaLoading(false);
      });
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const canSubmit =
    selectedCriteria &&
    !uploading &&
    (inputMode === 'image' ? !!imageFile : manualPrompt.trim().length > 0);

  async function handleSubmit() {
    if (!canSubmit) return;
    setUploading(true);
    setError(null);
    try {
      let topic: WritingTopic;
      if (inputMode === 'image' && imageFile) {
        topic = await uploadTopic(imageFile, selectedCriteria);
      } else {
        topic = await createTopicManual({
          gradingCriteria: selectedCriteria,
          title: manualTitle.trim() || null,
          writingPrompt: manualPrompt.trim(),
        });
      }
      onTopicCreated(topic);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">新建写作题目</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Criteria selector */}
        <label className="mb-1 block text-xs font-semibold text-slate-500">
          评分标准
        </label>
        <div className="relative mb-4">
          <select
            value={selectedCriteria}
            onChange={(e) => setSelectedCriteria(e.target.value)}
            disabled={criteriaLoading}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
          >
            {criteriaLoading && <option value="">加载中...</option>}
            {criteria.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
          />
        </div>

        {/* Input mode toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setInputMode('manual')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
              inputMode === 'manual'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-50 text-slate-400 hover:text-slate-600'
            }`}
          >
            <Type size={14} />
            手动输入题目
          </button>
          <button
            onClick={() => setInputMode('image')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
              inputMode === 'image'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-50 text-slate-400 hover:text-slate-600'
            }`}
          >
            <ImageIcon size={14} />
            拍照上传题目
          </button>
        </div>

        <AnimatePresence mode="wait">
          {inputMode === 'image' ? (
            <motion.div
              key="image-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Image upload area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 w-full bg-slate-50 object-contain"
                  />
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-4 flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-slate-400 transition-colors hover:border-violet-300 hover:text-violet-500"
                >
                  <div className="flex gap-2">
                    <Camera size={24} />
                    <Upload size={24} />
                  </div>
                  <span className="text-sm font-medium">
                    拍照或选择题目图片
                  </span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="manual-mode"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex flex-col gap-3"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  题目标题（选填）
                </label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="例如：IELTS Task 2 - Education"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  写作题目内容
                </label>
                <textarea
                  value={manualPrompt}
                  onChange={(e) => setManualPrompt(e.target.value)}
                  placeholder="请输入完整的写作题目要求..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mb-3 text-center text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {inputMode === 'image' ? 'AI 识别中...' : '创建中...'}
            </>
          ) : (
            <>
              <Check size={18} />
              确认
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

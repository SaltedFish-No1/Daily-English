'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadTopic, fetchCriteria } from '@/features/writing/lib/writingApi';
import type { GradingCriteria, WritingTopic } from '@/types/writing';
import { useEffect } from 'react';

interface TopicUploaderProps {
  onTopicCreated: (topic: WritingTopic) => void;
  onClose: () => void;
}

export function TopicUploader({ onTopicCreated, onClose }: TopicUploaderProps) {
  const [criteria, setCriteria] = useState<GradingCriteria[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCriteria().then((list) => {
      setCriteria(list);
      if (list.length > 0) setSelectedCriteria(list[0].id);
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

  async function handleUpload() {
    if (!imageFile || !selectedCriteria) return;
    setUploading(true);
    setError(null);
    try {
      const topic = await uploadTopic(imageFile, selectedCriteria);
      onTopicCreated(topic);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">上传写作题目</h2>
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
        <select
          value={selectedCriteria}
          onChange={(e) => setSelectedCriteria(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
        >
          {criteria.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Image upload area */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
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
                }}
                className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
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
              <span className="text-sm font-medium">拍照或选择题目图片</span>
            </motion.button>
          )}
        </AnimatePresence>

        {error && (
          <p className="mb-3 text-center text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleUpload}
          disabled={!imageFile || !selectedCriteria || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 disabled:opacity-50 disabled:shadow-none"
        >
          {uploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              AI 识别中...
            </>
          ) : (
            <>
              <Check size={18} />
              确认上传
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}

'use client';

/**
 * @author SaltedFish-No1
 * @description 反馈抽屉组件 — 底部 Drawer 承载反馈表单，提交时禁止关闭。
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { FeedbackForm } from './FeedbackForm';

interface FeedbackDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackDrawer({ open, onClose }: FeedbackDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto p-6 pt-4">
          {/* 标题 */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">意见反馈</h2>
            <Button
              variant="ghost"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X size={20} />
            </Button>
          </div>

          {/* 表单 */}
          <FeedbackForm onSuccess={onClose} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

'use client';

/**
 * @author SaltedFish-No1
 * @description PWA 安装引导弹窗，用于提示用户将应用安装到桌面，支持确认/取消双按钮模式。
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PWAInstallDialogProps {
  open: boolean;
  title: string;
  message: string;
  showConfirm: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function PWAInstallDialog({
  open,
  title,
  message,
  showConfirm,
  onConfirm,
  onClose,
}: PWAInstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {showConfirm && (
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              取消
            </Button>
          )}
          <Button
            onClick={showConfirm ? onConfirm : onClose}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {showConfirm ? '确认安装' : '知道了'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * @author shadcn/ui
 * @description shadcn/ui Dialog 组件 — 基于 @base-ui/react 的模态弹窗，用于桌面端确认操作和表单。
 */
import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const DialogBackdrop = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0',
      className
    )}
    {...props}
  />
));
DialogBackdrop.displayName = 'DialogBackdrop';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup> & {
    showBackdrop?: boolean;
  }
>(({ className, children, showBackdrop = true, ...props }, ref) => (
  <DialogPortal>
    {showBackdrop && <DialogBackdrop />}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <DialogPrimitive.Popup
        ref={ref}
        className={cn(
          'w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl',
          'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
          'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
          'transition-[transform,opacity]',
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </div>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />;
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-bold text-slate-900', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('mt-2 text-sm leading-relaxed text-slate-600', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-5 flex justify-end gap-2', className)} {...props} />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};

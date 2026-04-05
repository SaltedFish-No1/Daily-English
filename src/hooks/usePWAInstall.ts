/**
 * @description PWA 安装逻辑 hook：平台检测、beforeinstallprompt 管理与安装对话框状态。
 */

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallDialogState {
  open: boolean;
  title: string;
  message: string;
  showConfirm: boolean;
}

export const usePWAInstall = () => {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  // 检测 standalone / iOS / Safari 三状态，驱动下方安装流程的条件分支。
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    const standaloneByDisplayMode = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;
    const standaloneByNavigator =
      'standalone' in window.navigator &&
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      );
    return standaloneByDisplayMode || standaloneByNavigator;
  });
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  });
  const [isSafari] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  });
  const [installDialog, setInstallDialog] = useState<InstallDialogState>({
    open: false,
    title: '',
    message: '',
    showConfirm: false,
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 安装流程分支：已安装 → iOS非Safari → iOS+Safari → 无事件(通用提示) → 有事件(确认弹窗)。
  const handleInstall = async () => {
    // 已以 PWA 方式安装
    if (isStandalone) {
      setInstallDialog({
        open: true,
        title: '已安装',
        message: '薄荷外语 已经安装到本地。',
        showConfirm: false,
      });
      return;
    }
    if (!installEvent) {
      if (isIOS && !isSafari) {
        setInstallDialog({
          open: true,
          title: '请切换 Safari',
          message:
            'iOS 上 Edge/Chrome 不支持网页安装入口，请使用 Safari 打开后，通过"分享 -> 添加到主屏幕"安装。',
          showConfirm: false,
        });
        return;
      }
      if (isIOS && isSafari) {
        setInstallDialog({
          open: true,
          title: '手动安装',
          message: '请在 Safari 中点击"分享"按钮，然后选择"添加到主屏幕"。',
          showConfirm: false,
        });
        return;
      }
      setInstallDialog({
        open: true,
        title: '暂不可直接安装',
        message:
          '当前浏览器暂未触发安装事件，请使用浏览器菜单中的"安装应用"入口。',
        showConfirm: false,
      });
      return;
    }
    setInstallDialog({
      open: true,
      title: '确认安装',
      message: '确认安装 薄荷外语 到本地吗？',
      showConfirm: true,
    });
  };

  const closeInstallDialog = () => {
    setInstallDialog((prev) => ({ ...prev, open: false }));
  };

  const confirmInstall = async () => {
    if (!installEvent) {
      closeInstallDialog();
      return;
    }
    closeInstallDialog();
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === 'accepted') {
      setInstallDialog({
        open: true,
        title: '安装请求已提交',
        message: '系统正在完成安装流程，请稍候。',
        showConfirm: false,
      });
      return;
    }
    setInstallDialog({
      open: true,
      title: '已取消安装',
      message: '你已取消本次安装请求。',
      showConfirm: false,
    });
  };

  const installTitle = isStandalone ? '已安装' : '安装到本地';
  const installLabel = isStandalone ? '已安装' : '安装';

  return {
    isStandalone,
    installDialog,
    installTitle,
    installLabel,
    handleInstall,
    closeInstallDialog,
    confirmInstall,
  };
};

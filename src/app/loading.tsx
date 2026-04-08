/**
 * @author SaltedFish-No1
 * @description 全局加载状态回退组件，显示旋转加载动画。
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-5">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"></div>
      <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
        加载中...
      </p>
    </div>
  );
}

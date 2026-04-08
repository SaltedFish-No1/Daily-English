/**
 * @author SaltedFish-No1
 * @description 404 页面，当请求路径不存在时显示友好提示。
 */
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-5 text-center">
      <h2 className="mb-2 font-serif text-4xl font-bold text-slate-900">404</h2>
      <p className="mb-8 max-w-sm text-slate-500">
        抱歉，找不到您请求的课程或页面。
      </p>
      <Link
        href="/"
        replace
        className="rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
      >
        返回首页
      </Link>
    </div>
  );
}

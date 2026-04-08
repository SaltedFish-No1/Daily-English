/**
 * @author SaltedFish-No1
 * @description 关于页面薄壳，委托 AboutView 渲染关于信息。
 */
import { AboutView } from '@/features/about/components/AboutView';

export const metadata = {
  title: '关于 · 薄荷外语',
};

export default function AboutPage() {
  return <AboutView />;
}

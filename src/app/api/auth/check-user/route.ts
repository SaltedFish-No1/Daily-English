/**
 * @author SaltedFish-No1
 * @description 检查邮箱是否已注册 API：通过 Supabase Admin 查询用户是否存在。
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase().trim();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 尝试通过 generateLink 检测用户是否存在
    // generateLink 对已有用户和新用户都能成功，但我们可以利用
    // admin listUsers 分页查找
    let exists = false;
    let page = 1;
    const perPage = 50;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error('[check-user] listUsers failed:', error);
        return NextResponse.json(
          { error: '服务器错误，请稍后重试' },
          { status: 500 }
        );
      }

      if (data.users.some((u) => u.email === email)) {
        exists = true;
        break;
      }

      if (data.users.length < perPage) break;
      page++;
    }

    return NextResponse.json({ exists });
  } catch (err) {
    console.error('[check-user] Unexpected error:', err);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * @author SaltedFish-No1
 * @description 获取所有可用的写作评分标准列表。
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { mapGradingCriteriaRow } from '@/types/writing';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('grading_criteria')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Writing] grading_criteria query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grading criteria' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    criteria: (data ?? []).map(mapGradingCriteriaRow),
  });
}

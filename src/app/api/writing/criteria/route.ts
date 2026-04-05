/**
 * @description 获取所有可用的写作评分标准列表。
 *   如果 grading_criteria 表为空，自动写入种子数据。
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { mapGradingCriteriaRow } from '@/types/writing';
import { CRITERIA_SEED } from './seed';

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

  // Auto-seed when the table is empty
  if (!data || data.length === 0) {
    console.log('[Writing] grading_criteria table is empty, seeding defaults…');
    const { data: seeded, error: seedError } = await supabaseAdmin
      .from('grading_criteria')
      .upsert(CRITERIA_SEED, { onConflict: 'id' })
      .select('*')
      .order('created_at', { ascending: true });

    if (seedError) {
      console.error('[Writing] grading_criteria seed error:', seedError);
      return NextResponse.json(
        { error: 'Failed to seed grading criteria' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      criteria: (seeded ?? []).map(mapGradingCriteriaRow),
    });
  }

  return NextResponse.json({
    criteria: data.map(mapGradingCriteriaRow),
  });
}

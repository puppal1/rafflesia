// created: 2026-11-25T01:25:00-08:00 — PRD v4 J3 kid reports
import { supabase } from './supabase'

export type ReportTarget = 'post' | 'comment' | 'user'

/** created: 2026-11-25T01:25:00-08:00 */
export async function createContentReport(
  targetType: ReportTarget,
  targetId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc('create_content_report', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
  })
  if (error) {
    if (/create_content_report|schema cache/i.test(error.message)) {
      throw new Error('Reports need sql/prd-v4.sql — run in Supabase.')
    }
    throw error
  }
}

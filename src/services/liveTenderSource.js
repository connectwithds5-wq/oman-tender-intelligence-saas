import { supabase } from '../lib/supabase.js';

export async function syncAndLoadLiveTenders() {
  if (!supabase) return { tenders: [], source: 'unconfigured', sourceLabel: 'Demo data' };

  try {
    const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-oman-tenders', { body: {} });
    if (syncError) console.warn('[LiveTenderSource] Sync failed:', syncError.message);

    const { data, error } = await supabase
      .from('live_tenders')
      .select('id,title,authority,category,location,value,deadline,score,tags,status,summary,source_url')
      .order('updated_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    if (!data?.length) return { tenders: [], source: 'live-empty', sourceLabel: 'Live source (empty)', sync: syncData };

    return {
      tenders: data.map((t) => ({ ...t, score: Number(t.score || 0), tags: Array.isArray(t.tags) ? t.tags : [] })),
      source: 'live',
      sourceLabel: 'Oman ESNAD live source',
      sync: syncData,
    };
  } catch (error) {
    console.warn('[LiveTenderSource] Falling back:', error);
    return { tenders: [], source: 'live-error', sourceLabel: 'Live source unavailable', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

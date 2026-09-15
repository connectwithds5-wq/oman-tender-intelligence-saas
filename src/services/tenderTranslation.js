import { supabase } from '../lib/supabase.js';

const cacheKey = 'oti:tender-translations:v1';

function hasArabic(value) {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

function needsTranslation(tender) {
  return [tender.title, tender.authority, tender.category, tender.location, tender.summary, ...(tender.tags || [])].some(hasArabic);
}

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(cacheKey) || '{}'); } catch { return {}; }
}

function writeCache(cache) {
  try { sessionStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { /* cache is optional */ }
}

export async function translateTenders(tenders) {
  if (!supabase) return tenders;
  const cache = readCache();
  const output = tenders.map((t) => cache[t.id] ? { ...t, ...cache[t.id] } : t);
  const pending = output.filter((t) => needsTranslation(t) && !cache[t.id]);
  if (!pending.length) return output;

  for (let i = 0; i < pending.length; i += 40) {
    const batch = pending.slice(i, i + 40);
    try {
      const { data, error } = await supabase.functions.invoke('translate-tenders', { body: { tenders: batch } });
      if (error) throw error;
      for (const translated of (data?.translations || [])) {
        if (!translated?.id) continue;
        const patch = {
          title: translated.title,
          authority: translated.authority,
          category: translated.category,
          location: translated.location,
          summary: translated.summary,
          tags: Array.isArray(translated.tags) ? translated.tags : undefined,
          originalTitle: translated.originalTitle,
          originalSummary: translated.originalSummary,
          translationStatus: translated.translationStatus,
        };
        cache[translated.id] = patch;
        const index = output.findIndex((t) => t.id === translated.id);
        if (index >= 0) output[index] = { ...output[index], ...patch };
      }
      writeCache(cache);
    } catch (error) {
      console.warn('[TenderTranslation] Translation unavailable:', error);
      break;
    }
  }
  return output;
}

import { tenders as demoTenders } from '../data/tenders.js';
import { supabase } from '../lib/supabase.js';

const SOURCE_URL = import.meta.env.VITE_TENDER_SOURCE_URL?.trim();

function asString(value, fallback = '') {
  return value === null || value === undefined ? fallback : String(value);
}

function normalizeTender(item, index) {
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => asString(tag)).filter(Boolean) : [];
  return {
    id: asString(item.id, `UPSTREAM-${index + 1}`),
    title: asString(item.title || item.name, 'Untitled tender'),
    authority: asString(item.authority || item.issuer || item.organization, 'Unknown authority'),
    category: asString(item.category, 'Other'),
    location: asString(item.location || item.city, 'Oman'),
    value: asString(item.value || item.estimatedValue, 'Not disclosed'),
    deadline: asString(item.deadline || item.closingDate || item.submissionDeadline, ''),
    score: Number.isFinite(Number(item.score)) ? Number(item.score) : 0,
    tags,
    status: asString(item.status, 'Open'),
    summary: asString(item.summary || item.description, 'No summary available.'),
    source_url: asString(item.source_url, ''),
  };
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tenders)) return payload.tenders;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

async function readLiveTenders() {
  const { data, error } = await supabase
    .from('live_tenders')
    .select('id,title,authority,category,location,value,deadline,score,tags,status,summary,source_url')
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function loadTenders() {
  if (supabase) {
    try {
      const data = await readLiveTenders();
      if (data.length) return { tenders: data.map(normalizeTender), source: 'live', sourceLabel: 'Oman ESNAD live source' };
    } catch (error) {
      console.warn('[TenderSource] Cached live source unavailable:', error);
    }
  }

  if (!SOURCE_URL) return { tenders: demoTenders, source: 'demo', sourceLabel: 'Demo data' };

  try {
    const response = await fetch(SOURCE_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Tender source returned HTTP ${response.status}`);
    const payload = await response.json();
    const items = extractItems(payload);
    if (!items.length) throw new Error('Tender source returned no recognizable tender records');
    return { tenders: items.map(normalizeTender), source: 'upstream', sourceLabel: 'Connected source' };
  } catch (error) {
    console.warn('[TenderSource] Falling back to demo data:', error);
    return { tenders: demoTenders, source: 'demo-fallback', sourceLabel: 'Demo fallback', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function refreshTenders() {
  if (!supabase) return loadTenders();
  const { data, error } = await supabase.functions.invoke('sync-oman-tenders', { body: {} });
  if (error) throw error;
  const result = await loadTenders();
  return { ...result, sync: data };
}

import { supabase } from '../lib/supabase.js';

export async function analyzeTender(tender) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('ai-tender-analysis', { body: { tender } });
  if (error) throw error;
  if (data?.error) {
    const err = new Error(data.error);
    err.code = data.code;
    err.limit = data.limit;
    err.used = data.used;
    throw err;
  }
  return data;
}

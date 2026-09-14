import { supabase } from '../lib/supabase.js';

export async function analyzeTender(tender) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('analyze-tender', { body: { tender } });
  if (error) throw error;
  if (data?.error) {
    const error = new Error(data.error);
    error.code = data.code;
    error.limit = data.limit;
    error.used = data.used;
    throw error;
  }
  return data;
}

import { supabase } from '../lib/supabase.js';

export async function createCheckoutSession(plan) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('create-checkout-session', { body: { plan } });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error || 'Checkout could not be created.');
  window.location.assign(data.url);
}

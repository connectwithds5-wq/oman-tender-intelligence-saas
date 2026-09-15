import { supabase } from '../lib/supabase.js';

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUp(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.session;
}

export async function resendSignupEmail(email) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuth(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function loadAccountData(userId) {
  if (!supabase || !userId) return { profile: null, saved: [], subscription: null };
  const [{ data: profile }, { data: saved }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('company_name,sectors,locations,contract_size,plan').eq('id', userId).maybeSingle(),
    supabase.from('saved_tenders').select('tender_id').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('plan,status,current_period_end,cancel_at_period_end').eq('user_id', userId).maybeSingle(),
  ]);
  return { profile, saved: (saved ?? []).map((row) => row.tender_id), subscription };
}

export async function saveProfile(userId, profile) {
  if (!supabase || !userId) return;
  const payload = {
    id: userId,
    company_name: profile.company || null,
    sectors: profile.sectors ?? [],
    locations: profile.locations ?? [],
    contract_size: profile.size || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  const { error: preferenceError } = await supabase.from('tender_preferences').upsert({
    user_id: userId,
    sectors: payload.sectors,
    locations: payload.locations,
    contract_size: payload.contract_size,
    updated_at: payload.updated_at,
  }, { onConflict: 'user_id' });
  if (preferenceError) throw preferenceError;
}

export async function setTenderSaved(userId, tenderId, shouldSave) {
  if (!supabase || !userId) return;
  if (shouldSave) {
    const { error } = await supabase.from('saved_tenders').upsert({ user_id: userId, tender_id: tenderId }, { onConflict: 'user_id,tender_id' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('saved_tenders').delete().eq('user_id', userId).eq('tender_id', tenderId);
    if (error) throw error;
  }
}

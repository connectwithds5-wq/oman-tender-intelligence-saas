function normalize(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
}

function contractBand(value) {
  const v = normalize(value);
  if (v.includes('under omr 100k')) return 'under100';
  if (v.includes('100k') && v.includes('300k')) return '100to300';
  if (v.includes('300k')) return 'over300';
  return 'unknown';
}

function tenderValueBand(value) {
  const n = Number(String(value || '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n)) return 'unknown';
  if (n < 100000) return 'under100';
  if (n <= 300000) return '100to300';
  return 'over300';
}

export function getTenderMatchReasons(tender, profile) {
  const sectors = (profile?.sectors || []).map(normalize).filter(Boolean);
  const locations = (profile?.locations || []).map(normalize).filter(Boolean);
  const sector = normalize(tender.category);
  const location = normalize(tender.location);
  const text = normalize(`${tender.title} ${tender.summary} ${(tender.tags || []).join(' ')}`);
  const reasons = [];

  if (sectors.length && sectors.some(s => sector === s || sector.includes(s) || s.includes(sector) || text.includes(s))) {
    reasons.push('Sector match');
  }

  if (locations.length && locations.some(l => location === l || location.includes(l) || l.includes(location))) {
    reasons.push('Location match');
  }

  const preferredBand = contractBand(profile?.size);
  const tenderBand = tenderValueBand(tender.value);
  if (preferredBand !== 'unknown' && tenderBand !== 'unknown' && preferredBand === tenderBand) {
    reasons.push('Contract size match');
  }

  return reasons;
}

export function tailorTenderScore(tender, profile) {
  const sectors = (profile?.sectors || []).map(normalize).filter(Boolean);
  const locations = (profile?.locations || []).map(normalize).filter(Boolean);
  const sector = normalize(tender.category);
  const location = normalize(tender.location);
  const text = normalize(`${tender.title} ${tender.summary} ${(tender.tags || []).join(' ')}`);

  let score = Number.isFinite(Number(tender.score)) ? Number(tender.score) : 50;

  if (sectors.length) {
    const sectorMatch = sectors.some(s => sector === s || sector.includes(s) || s.includes(sector) || text.includes(s));
    score += sectorMatch ? 12 : -5;
  }

  if (locations.length) {
    const locationMatch = locations.some(l => location === l || location.includes(l) || l.includes(location));
    score += locationMatch ? 8 : -3;
  }

  const preferredBand = contractBand(profile?.size);
  const tenderBand = tenderValueBand(tender.value);
  if (preferredBand !== 'unknown' && tenderBand !== 'unknown') {
    score += preferredBand === tenderBand ? 8 : -2;
  }

  const keywordHits = sectors.filter(s => text.includes(s)).length;
  score += Math.min(6, keywordHits * 2);

  return Math.max(0, Math.min(99, Math.round(score)));
}

export function tailorTenders(tenders, profile) {
  return tenders
    .map(tender => ({ ...tender, score: tailorTenderScore(tender, profile) }))
    .sort((a, b) => b.score - a.score);
}

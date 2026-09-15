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

function prettyBand(band) {
  return ({ under100: 'Under OMR 100k', 100to300: 'OMR 100k–300k', over300: 'OMR 300k+' })[band] || '';
}

export function getTenderMatchBreakdown(tender, profile) {
  const sectors = (profile?.sectors || []).map(normalize).filter(Boolean);
  const locations = (profile?.locations || []).map(normalize).filter(Boolean);
  const sector = normalize(tender.category);
  const location = normalize(tender.location);
  const text = normalize(`${tender.title} ${tender.summary} ${(tender.tags || []).join(' ')}`);
  const baseScore = Number.isFinite(Number(tender.score)) ? Number(tender.score) : 50;
  const breakdown = [{ label: 'Source relevance', value: baseScore, tone: 'base' }];

  const matchedSector = (profile?.sectors || []).find((original, i) => {
    const s = sectors[i];
    return sector === s || sector.includes(s) || s.includes(sector) || text.includes(s);
  });
  if (sectors.length) breakdown.push({ label: matchedSector ? `Sector: ${matchedSector}` : 'Sector mismatch', value: matchedSector ? 12 : -5, tone: matchedSector ? 'positive' : 'negative' });

  const matchedLocation = (profile?.locations || []).find((original, i) => {
    const l = locations[i];
    return location === l || location.includes(l) || l.includes(location);
  });
  if (locations.length) breakdown.push({ label: matchedLocation ? `Location: ${matchedLocation}` : 'Location mismatch', value: matchedLocation ? 8 : -3, tone: matchedLocation ? 'positive' : 'negative' });

  const preferredBand = contractBand(profile?.size);
  const tenderBand = tenderValueBand(tender.value);
  if (preferredBand !== 'unknown' && tenderBand !== 'unknown') {
    const match = preferredBand === tenderBand;
    breakdown.push({ label: match ? `Contract size: ${prettyBand(tenderBand)}` : 'Contract size mismatch', value: match ? 8 : -2, tone: match ? 'positive' : 'negative' });
  }

  const keywordHits = sectors.filter(s => text.includes(s)).length;
  const keywordBonus = Math.min(6, keywordHits * 2);
  if (keywordBonus) breakdown.push({ label: 'Profile keyword relevance', value: keywordBonus, tone: 'positive' });

  const rawTotal = breakdown.reduce((sum, item) => sum + item.value, 0);
  const total = Math.max(0, Math.min(99, Math.round(rawTotal)));
  return { baseScore, total, breakdown };
}

export function getTenderMatchReasons(tender, profile) {
  const { breakdown, total } = getTenderMatchBreakdown(tender, profile);
  return [
    `Score breakdown: ${breakdown.map(item => `${item.label} ${item.value >= 0 ? '+' : ''}${item.value}`).join(' · ')} = ${total}%`,
    ...breakdown.filter(item => item.tone === 'positive' && item.label !== 'Profile keyword relevance').map(item => item.label),
  ];
}

export function tailorTenderScore(tender, profile) {
  return getTenderMatchBreakdown(tender, profile).total;
}

export function tailorTenders(tenders, profile) {
  return tenders
    .map(tender => ({ ...tender, score: tailorTenderScore(tender, profile) }))
    .sort((a, b) => b.score - a.score);
}

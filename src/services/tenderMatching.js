const SECTOR_KEYWORDS = {
  'IT & Telecom': ['it','telecom','network','networking','fiber','fibre','cabling','lan','wan','wifi','wireless','cctv','surveillance','access control','attendance','server','storage','data center','datacenter','computer','hardware','security'],
  'IT & Software': ['software','application','app','system','erp','crm','licensing','license','cloud','saas','database','cybersecurity','cyber security','information technology','digital'],
  Construction: ['construction','civil','building','renovation','road','infrastructure','concrete','structural','fit out','fitout'],
  Facilities: ['facilities','facility','maintenance','cleaning','housekeeping','mep','hvac','plumbing','landscaping','pest control'],
  Electrical: ['electrical','electric','power','generator','transformer','lighting','switchgear','cable','solar'],
};

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
  return ({ under100: 'Under OMR 100k', '100to300': 'OMR 100k–300k', over300: 'OMR 300k+' })[band] || '';
}

function sourceBaseline(value) {
  const n = Number(value);
  // The upstream feed can return a low placeholder-like score (e.g. 17) for many records.
  // Do not let that collapse every personalized match to the same number.
  if (!Number.isFinite(n) || n <= 20) return 45;
  return Math.max(25, Math.min(85, n));
}

function sectorMatch(sectorName, category, text) {
  const normalizedSector = normalize(sectorName);
  const normalizedCategory = normalize(category);
  if (normalizedCategory === normalizedSector || normalizedCategory.includes(normalizedSector) || normalizedSector.includes(normalizedCategory)) return true;
  const keywords = SECTOR_KEYWORDS[sectorName] || [];
  return keywords.some(keyword => text.includes(normalize(keyword)));
}

export function getTenderMatchBreakdown(tender, profile) {
  const sectors = Array.isArray(profile?.sectors) ? profile.sectors.filter(Boolean) : [];
  const locations = Array.isArray(profile?.locations) ? profile.locations.filter(Boolean) : [];
  const category = tender?.category || '';
  const location = normalize(tender?.location);
  const text = normalize(`${tender?.title || ''} ${category} ${tender?.summary || ''} ${(tender?.tags || []).join(' ')}`);
  const baseScore = sourceBaseline(tender?.score);
  const breakdown = [{ label: 'Source relevance', value: baseScore, tone: 'base' }];

  if (sectors.length) {
    const matched = sectors.find(s => sectorMatch(s, category, text));
    breakdown.push({ label: matched ? `Sector: ${matched}` : 'Sector mismatch', value: matched ? 15 : -8, tone: matched ? 'positive' : 'negative' });

    const keywordMatches = new Set();
    sectors.forEach(s => (SECTOR_KEYWORDS[s] || []).forEach(keyword => {
      const k = normalize(keyword);
      if (k && text.includes(k)) keywordMatches.add(k);
    }));
    const keywordBonus = Math.min(10, keywordMatches.size * 2);
    if (keywordBonus) breakdown.push({ label: 'Capability keywords', value: keywordBonus, tone: 'positive' });
  }

  if (locations.length) {
    const matchedLocation = locations.find(l => {
      const normalized = normalize(l);
      return normalized && (location === normalized || location.includes(normalized) || normalized.includes(location));
    });
    breakdown.push({ label: matchedLocation ? `Location: ${matchedLocation}` : 'Location mismatch', value: matchedLocation ? 10 : -5, tone: matchedLocation ? 'positive' : 'negative' });
  }

  const preferredBand = contractBand(profile?.size);
  const tenderBand = tenderValueBand(tender?.value);
  if (preferredBand !== 'unknown' && tenderBand !== 'unknown') {
    const match = preferredBand === tenderBand;
    breakdown.push({ label: match ? `Contract size: ${prettyBand(tenderBand)}` : 'Contract size mismatch', value: match ? 8 : -4, tone: match ? 'positive' : 'negative' });
  }

  const rawTotal = breakdown.reduce((sum, item) => sum + item.value, 0);
  const total = Math.max(0, Math.min(99, Math.round(rawTotal)));
  return { baseScore, total, breakdown };
}

export function getTenderMatchReasons(tender, profile) {
  const { breakdown, total } = getTenderMatchBreakdown(tender, profile);
  return [
    `Score breakdown: ${breakdown.map(item => `${item.label} ${item.value >= 0 ? '+' : ''}${item.value}`).join(' · ')} = ${total}%`,
    ...breakdown.filter(item => item.tone === 'positive' && item.label !== 'Capability keywords').map(item => item.label),
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

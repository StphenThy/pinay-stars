import { statusMeta } from '../theme';

export const GENRES = [
  'Drama', 'Romance', 'Comedy', 'Action', 'Musical', 'Thriller',
  'Psychological Thriller', 'Indie', 'Fantasy', 'Horror',
];

export const ERAS = [
  { key: 'all',   label: 'All Eras',                          tag: '1960s–Pres.' },
  { key: '2020s', label: '2020s (Modern Wave)',               tag: 'New Gen',  from: 2020 },
  { key: '2010s', label: '2010s to Present (Golden Modern)',  tag: 'Current',  from: 2010, to: 2019 },
  { key: '2000s', label: '2000s (Classic Millennium)',        tag: 'Icons',    from: 2000, to: 2009 },
  { key: '1990s', label: '1990s & Earlier (Pioneers)',        tag: 'Legends',  to: 1999 },
];

export const STATUSES = Object.keys(statusMeta).map(key => ({ key, ...statusMeta[key] }));

export const SORTS = [
  { key: 'popular', label: 'Popularity / Star Rank', short: 'Most Popular' },
  { key: 'recent',  label: 'Recently Added to Database', short: 'Recently Added' },
  { key: 'alpha',   label: 'Alphabetical (A–Z)', short: 'A–Z' },
  { key: 'awards',  label: 'Most Awards Won', short: 'Most Awards' },
];

export const DEFAULT_FILTERS = { genres: [], era: 'all', status: 'all', sort: 'popular' };

export const BIO_LIMIT = 1200;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export const parseList = value =>
  String(value || '').split('|').map(s => s.trim()).filter(Boolean);

export const serializeList = items =>
  (items || []).map(s => String(s).trim()).filter(Boolean).join('|');

export const linesToList = text =>
  String(text || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

export const listToLines = items => (items || []).join('\n');

export function ageFrom(birthday) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || '');
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

export function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
  if (!match) return isoDate || '';
  const [, y, m, d] = match.map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function formatBirthday(birthday, status) {
  const text = formatDate(birthday);
  if (!text) return 'Birth date not on record';
  if (status === 'memoriam') return text;
  const age = ageFrom(birthday);
  return age === null ? text : `${text} (Age ${age})`;
}

const monthIndex = name => {
  const key = String(name).toLowerCase().slice(0, 3);
  const i = MONTHS.findIndex(m => m.toLowerCase().startsWith(key));
  return i === -1 ? null : i + 1;
};

const isoOrNull = (y, m, d) => {
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  if (d > new Date(y, m, 0).getDate()) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

// Parsed by hand: Hermes (React Native's engine) does not reliably parse "March 26, 1996".
// Accepts "March 26, 1996", "Mar 26 1996", "26 March 1996", "1996-03-26", "03/26/1996".
export function toIsoDate(input) {
  const text = String(input || '').trim().replace(/\s+/g, ' ').replace(/ ,/g, ',');
  if (!text) return '';
  let m;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text))) return isoOrNull(+m[1], +m[2], +m[3]);
  if ((m = /^([A-Za-z]+)\.? (\d{1,2}),? (\d{4})$/.exec(text))) return isoOrNull(+m[3], monthIndex(m[1]), +m[2]);
  if ((m = /^(\d{1,2}) ([A-Za-z]+)\.?,? (\d{4})$/.exec(text))) return isoOrNull(+m[3], monthIndex(m[2]), +m[1]);
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text))) return isoOrNull(+m[3], +m[1], +m[2]);
  return null;
}

export function debutYear(yearsActive) {
  const match = /(19|20)\d{2}/.exec(yearsActive || '');
  return match ? Number(match[0]) : null;
}

export function eraOf(actress) {
  const year = debutYear(actress.yearsActive);
  if (year === null) return 'all';
  const era = ERAS.find(e => e.key !== 'all' && (e.from === undefined || year >= e.from) && (e.to === undefined || year <= e.to));
  return era ? era.key : 'all';
}

export function tenureLabel(yearsActive) {
  const year = debutYear(yearsActive);
  if (year === null) return null;
  const years = new Date().getFullYear() - year;
  if (years < 5) return 'Rising';
  return `${Math.floor(years / 5) * 5}+ Yrs`;
}

export const displayId = id => `PS-${String(id).padStart(4, '0')}`;

export function formatReviews(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'No ratings yet';
  if (n >= 1000) return `${Math.round(n / 1000)}k ratings`;
  return `${n} rating${n === 1 ? '' : 's'}`;
}

export function normalizeActress(row) {
  const name = String(row.name || '').trim() || 'Untitled actress';
  const stageName = String(row.stage_name || '').trim() || name;
  const status = statusMeta[row.status] ? row.status : 'active';
  const awards = parseList(row.awards);
  return {
    id: row.id,
    displayId: displayId(row.id),
    name,
    stageName,
    birthday: row.birthday || '',
    birthplace: row.birthplace || '',
    occupation: row.occupation || 'Actress',
    agency: row.agency || 'Independent',
    biography: row.biography || '',
    image: row.image_url || '',
    genres: parseList(row.genres),
    films: parseList(row.films),
    tvSeries: parseList(row.tv_series),
    awards,
    yearsActive: row.years_active || '',
    status,
    rating: Number(row.rating) || 0,
    reviewsCount: Number(row.reviews_count) || 0,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    badge: awards[0] || row.occupation || 'Pinay Star',
  };
}

export const emptyForm = () => ({
  name: '', stageName: '', birthday: '', birthplace: '', occupation: 'Actress',
  agency: '', biography: '', image: '', genres: [], films: '', tvSeries: '',
  awards: '', yearsActive: '', status: 'active',
});

export function formFromActress(a) {
  return {
    name: a.name,
    stageName: a.stageName === a.name ? '' : a.stageName,
    birthday: formatDate(a.birthday),
    birthplace: a.birthplace,
    occupation: a.occupation,
    agency: a.agency,
    biography: a.biography,
    image: a.image,
    genres: [...a.genres],
    films: listToLines(a.films),
    tvSeries: listToLines(a.tvSeries),
    awards: listToLines(a.awards),
    yearsActive: a.yearsActive,
    status: a.status,
  };
}

export function validateForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full legal name is required.';
  if (!form.stageName.trim() && !form.name.trim()) errors.stageName = 'Stage name is required.';
  const iso = toIsoDate(form.birthday);
  if (!form.birthday.trim()) errors.birthday = 'Birth date is required.';
  else if (iso === null) errors.birthday = 'Use a format like March 26, 1996.';
  if (!form.biography.trim()) errors.biography = 'A biography is required.';
  else if (form.biography.length > BIO_LIMIT) errors.biography = `Keep the biography under ${BIO_LIMIT} characters.`;
  if (!form.genres.length) errors.genres = 'Select at least one genre.';
  if (form.image.trim() && !/^https?:\/\/\S+$/i.test(form.image.trim())) errors.image = 'Enter a full http(s) image link.';
  return errors;
}

export function toPayload(form, existing) {
  return {
    name: form.name.trim(),
    stage_name: form.stageName.trim() || form.name.trim(),
    birthday: toIsoDate(form.birthday) || '',
    birthplace: form.birthplace.trim(),
    occupation: form.occupation.trim() || 'Actress',
    agency: form.agency.trim() || 'Independent',
    biography: form.biography.trim(),
    image_url: form.image.trim(),
    genres: serializeList(form.genres),
    films: serializeList(linesToList(form.films)),
    tv_series: serializeList(linesToList(form.tvSeries)),
    awards: serializeList(linesToList(form.awards)),
    years_active: form.yearsActive.trim(),
    status: form.status,
  };
}

export function matchesQuery(a, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [a.stageName, a.name, a.agency, ...a.genres, ...a.films, ...a.tvSeries]
    .join(' ').toLowerCase();
  return haystack.includes(q);
}

export function applyFilters(list, filters, query = '') {
  return list.filter(a => {
    if (!matchesQuery(a, query)) return false;
    if (filters.genres.length && !filters.genres.some(g => a.genres.includes(g))) return false;
    if (filters.era !== 'all' && eraOf(a) !== filters.era) return false;
    if (filters.status !== 'all' && a.status !== filters.status) return false;
    return true;
  });
}

export function sortActresses(list, sort) {
  const sorted = [...list];
  if (sort === 'alpha') sorted.sort((a, b) => a.stageName.localeCompare(b.stageName));
  else if (sort === 'recent') sorted.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  else if (sort === 'awards') sorted.sort((a, b) => b.awards.length - a.awards.length || b.rating - a.rating);
  // Popularity: rated actresses first (by average, then how many rated), then the rest by honours.
  else sorted.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount || b.awards.length - a.awards.length || a.stageName.localeCompare(b.stageName));
  return sorted;
}

export function activeFilterCount(filters) {
  return filters.genres.length + (filters.era !== 'all' ? 1 : 0) + (filters.status !== 'all' ? 1 : 0);
}

export function recentlyUpdated(a, days = 30) {
  if (!a.updatedAt) return false;
  const stamp = new Date(String(a.updatedAt).replace(' ', 'T'));
  if (Number.isNaN(stamp.getTime())) return false;
  return (Date.now() - stamp.getTime()) / 86400000 <= days;
}

export function toCsv(list) {
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['ID', 'Stage Name', 'Legal Name', 'Birthday', 'Birthplace', 'Agency', 'Genres', 'Films', 'TV Series', 'Awards', 'Years Active', 'Status', 'Rating'];
  const rows = list.map(a => [
    a.displayId, a.stageName, a.name, a.birthday, a.birthplace, a.agency,
    a.genres.join('; '), a.films.join('; '), a.tvSeries.join('; '), a.awards.join('; '),
    a.yearsActive, a.status, a.rating,
  ].map(escape).join(','));
  return [header.map(escape).join(','), ...rows].join('\n');
}

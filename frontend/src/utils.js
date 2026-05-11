export const YEARS      = ['2023', '2024', '2025']
export const EPS_KEYS   = new Set(['EPS'])
export const XRATE_KEYS = new Set(['이자보상배율'])

export const INCOME_KEYS  = ['매출','매출원가','매출총이익','판관비','영업이익',
                             '금융수익','금융비용','세전이익','법인세비용','당기순이익','EPS']
export const BALANCE_KEYS = ['유동자산','비유동자산','자산총계',
                             '유동부채','비유동부채','부채총계','이익잉여금','자본총계']
export const RATIO_KEYS   = ['영업이익률','순이익률','ROE','ROA',
                             '부채비율','유동비율','이자보상배율']
export const SECTIONS     = [
  { title: '손익계산서', keys: INCOME_KEYS,  isRatio: false },
  { title: '재무상태표', keys: BALANCE_KEYS, isRatio: false },
  { title: '수익성 지표', keys: RATIO_KEYS,  isRatio: true  },
]

export const OPINION_KEYS = [
  ['수익성', '영업이익률'],   ['수익성', '순이익률'],
  ['수익성', '매출총이익률'], ['효율성', 'ROE'],
  ['효율성', 'ROA'],          ['안정성', '부채비율'],
  ['안정성', '유동비율'],     ['안정성', '이자보상배율'],
  ['안정성', '이익잉여금 비율'],
  ['성장성', '매출 성장률'],  ['성장성', '영업이익 성장률'],
  ['성장성', '순이익 성장률'], ['총평', '종합 의견'],
]

export const LV_COLOR = { good: '#05C072', note: '#F59E0B', warn: '#F97316', danger: '#F04452' }
export const LV_BG    = { good: '#E8FBF3', note: '#FFFBEB', warn: '#FFF4ED', danger: '#FFF0F1' }
export const LV_ICON  = { good: '✓', note: '!', warn: '△', danger: '✕' }

export function fmtNum(n, key = '') {
  if (n === null || n === undefined) return 'N/A'
  if (EPS_KEYS.has(key)) return `${Math.round(n).toLocaleString()}원`
  const v = n / 1e8
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)}조`
  return `${v.toFixed(1)}억`
}

export function fmtRatio(v, key = '') {
  if (v === null || v === undefined) return 'N/A'
  if (XRATE_KEYS.has(key)) return `${Number(v).toFixed(2)}x`
  return `${Number(v).toFixed(1)}%`
}

export function fmtVal(v, key, isRatio) {
  return isRatio ? fmtRatio(v, key) : fmtNum(v, key)
}

export function yoy(cur, prev) {
  if (cur == null || prev == null || prev === 0) return { text: '', color: '#B0B8C1' }
  const r = (cur - prev) / Math.abs(prev) * 100
  if (r > 0)  return { text: `▲${Math.abs(r).toFixed(1)}%`, color: '#05C072' }
  if (r < 0)  return { text: `▼${Math.abs(r).toFixed(1)}%`, color: '#F04452' }
  return { text: '─', color: '#B0B8C1' }
}

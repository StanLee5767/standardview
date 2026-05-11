import { useState, useMemo } from 'react'
import { API } from '../App.jsx'
import SimpleMarkdown from './SimpleMarkdown.jsx'

const CUR_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => String(CUR_YEAR - i))

const FIN_FIELDS = [
  { key: 'revenue',             label: '매출',        unit: '백만원' },
  { key: 'operating_profit',    label: '영업이익',    unit: '백만원' },
  { key: 'net_income',          label: '당기순이익',  unit: '백만원' },
  { key: 'total_assets',        label: '자산총계',    unit: '백만원' },
  { key: 'total_liabilities',   label: '부채총계',    unit: '백만원' },
  { key: 'equity',              label: '자본총계',    unit: '백만원' },
  { key: 'current_assets',      label: '유동자산',    unit: '백만원', optional: true },
  { key: 'current_liabilities', label: '유동부채',    unit: '백만원', optional: true },
]

function calcRatios(fin) {
  const n = k => fin[k] ? Number(fin[k]) : null
  const rev = n('revenue'), op = n('operating_profit'), net = n('net_income')
  const ast = n('total_assets'), eq = n('equity'), dbt = n('total_liabilities')
  const ca = n('current_assets'), cl = n('current_liabilities')
  const pct = (a, b) => (a != null && b) ? +(a / b * 100).toFixed(2) : null
  return [
    { label: '영업이익률',  value: pct(op, rev),  fmt: '%' },
    { label: '순이익률',    value: pct(net, rev), fmt: '%' },
    { label: 'ROE',         value: pct(net, eq),  fmt: '%' },
    { label: 'ROA',         value: pct(net, ast), fmt: '%' },
    { label: '부채비율',    value: pct(dbt, eq),  fmt: '%' },
    { label: '유동비율',    value: pct(ca, cl),   fmt: '%' },
  ]
}

function RatioBar({ label, value, fmt }) {
  if (value == null) return null
  const good = (label === '영업이익률' && value > 10) || (label === '순이익률' && value > 5) ||
               (label === 'ROE' && value > 10) || (label === 'ROA' && value > 5) ||
               (label === '유동비율' && value > 150)
  const warn = (label === '부채비율' && value > 200) || (label === '유동비율' && value < 100)
  const color = warn ? '#EA580C' : good ? '#059669' : '#3182F6'
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}{fmt}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

export default function UnlistedFallback({ corpName, dartStatus, color = '#3182F6' }) {
  const [fin, setFin]           = useState({})
  const [year, setYear]         = useState(String(CUR_YEAR - 1))
  const [industry, setIndustry] = useState('')
  const [dealType, setDealType] = useState('M&A')
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [memoData, setMemoData] = useState(null)
  const [error, setError]       = useState(null)

  const setField = (k, v) => setFin(prev => ({ ...prev, [k]: v }))
  const ratios = useMemo(() => calcRatios(fin), [fin])
  const hasAnyFin = FIN_FIELDS.some(f => fin[f.key])

  const noData = dartStatus && !dartStatus.found
  const hasCodeNoFin = dartStatus && dartStatus.found && !dartStatus.has_financials

  const generateMemo = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/manual-deal-memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corp_name: corpName,
          industry,
          deal_type: dealType,
          year,
          notes,
          ...Object.fromEntries(
            FIN_FIELDS.map(f => [f.key, fin[f.key] ? Number(fin[f.key]) : null])
          ),
        }),
      })
      if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)
      setMemoData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadMemo = (ext) => {
    if (!memoData?.memo) return
    const blob = new Blob([memoData.memo], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${corpName}_DealMemo.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 py-2">

      {/* 상태 배너 */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {noData ? 'DART 미등록 기업' : hasCodeNoFin ? 'DART 재무제표 없음' : '비상장/비공시 기업 분석 모드'}
            </p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              해당 기업은 DART에서 구조화된 재무제표 데이터를 찾을 수 없습니다.
              비상장 기업이거나, 해당 연도의 정기보고서/재무제표가 공시되지 않았을 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 수동 재무정보 입력 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">수동 재무정보 입력</h4>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">기준연도</label>
              <select value={year} onChange={e => setYear(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400">
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">단위: 백만원 (1억 = 100)</p>

          <div className="space-y-2">
            {FIN_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <label className="text-xs text-gray-600 w-24 shrink-0">
                  {f.label}
                  {f.optional && <span className="text-gray-300 ml-1">(선택)</span>}
                </label>
                <input
                  type="number"
                  value={fin[f.key] ?? ''}
                  onChange={e => setField(f.key, e.target.value)}
                  placeholder="0"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-right
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             placeholder-gray-200"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 재무비율 + 딜 설정 */}
        <div className="space-y-4">
          {/* 자동 계산 비율 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-3">재무비율 (자동 계산)</h4>
            {hasAnyFin ? (
              <div>
                {ratios.map(r => <RatioBar key={r.label} {...r} />)}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">
                좌측에 재무 수치를 입력하면 자동으로 계산됩니다
              </p>
            )}
          </div>

          {/* Deal Memo 설정 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h4 className="text-sm font-bold text-gray-800">Deal Memo 설정</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">산업/섹터</label>
                <input value={industry} onChange={e => setIndustry(e.target.value)}
                  placeholder="예: 핀테크, SaaS"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             placeholder-gray-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">딜 유형</label>
                <select value={dealType} onChange={e => setDealType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {['M&A', 'VC', 'PE', 'IPO', 'CFO'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">추가 메모 (선택)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="알려진 정보, 특이사항 등을 자유롭게 입력..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                           placeholder-gray-300" />
            </div>
            <button onClick={generateMemo} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold
                         transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0D1B2A', color: '#fff' }}>
              {loading ? <><Spinner /> Deal Memo 생성 중...</> : 'Deal Memo 생성'}
            </button>
          </div>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠ {error}</div>
      )}

      {/* Deal Memo 결과 */}
      {memoData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">Deal Memo — {corpName}</h4>
            <div className="flex gap-2">
              <button onClick={() => downloadMemo('md')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                ⬇ .md
              </button>
              <button onClick={() => downloadMemo('txt')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                ⬇ .txt
              </button>
            </div>
          </div>
          <div className="prose prose-sm max-w-none border-t border-gray-100 pt-4">
            <SimpleMarkdown content={memoData.memo} />
          </div>
        </div>
      )}
    </div>
  )
}

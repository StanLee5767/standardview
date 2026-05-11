import { useState, useEffect, useCallback } from 'react'
import { API } from '../App.jsx'
import SimpleMarkdown from './SimpleMarkdown.jsx'
import InsightModal from './InsightModal.jsx'
import MacroNewsBriefPanel from './MacroNewsBriefPanel.jsx'

// ── 지표 카탈로그 (백엔드 GET /api/macro/indicators 와 동일 구조, 프론트 fallback용) ──
const CATALOG = {
  domestic: [
    { id:'kr_rate',    name:'기준금리',       unit:'%',      category:'금리' },
    { id:'kr_3y',      name:'국고채 3년',     unit:'%',      category:'금리' },
    { id:'kr_10y',     name:'국고채 10년',    unit:'%',      category:'금리' },
    { id:'usdkrw',     name:'원/달러 환율',   unit:'원',     category:'환율' },
    { id:'kr_cpi',     name:'CPI',           unit:'%(YoY)', category:'물가' },
    { id:'kr_ppi',     name:'PPI',           unit:'%(YoY)', category:'물가' },
    { id:'kr_gdp',     name:'GDP 성장률',    unit:'%(YoY)', category:'경기' },
    { id:'kr_export',  name:'수출',          unit:'억달러', category:'무역' },
    { id:'kr_import',  name:'수입',          unit:'억달러', category:'무역' },
    { id:'kr_ca',      name:'경상수지',      unit:'억달러', category:'무역' },
    { id:'kr_csi',     name:'소비자심리지수', unit:'pt',     category:'심리' },
    { id:'kr_bsi',     name:'기업경기 BSI',  unit:'pt',     category:'심리' },
    { id:'kr_unemploy',name:'실업률',        unit:'%',      category:'고용' },
    { id:'kr_hpi',     name:'주택가격지수',  unit:'%(MoM)', category:'부동산' },
  ],
  global: [
    { id:'us_rate',    name:'미국 기준금리', unit:'%',       category:'금리' },
    { id:'us_10y',     name:'미국 10년물',  unit:'%',       category:'금리' },
    { id:'us_cpi',     name:'미국 CPI',     unit:'%(YoY)', category:'물가' },
    { id:'us_gdp',     name:'미국 GDP',     unit:'%(QoQ*)',category:'경기' },
    { id:'us_unemploy',name:'미국 실업률',  unit:'%',       category:'고용' },
    { id:'dxy',        name:'달러인덱스',   unit:'pt',      category:'환율' },
    { id:'wti',        name:'WTI 유가',     unit:'USD/bbl', category:'원자재' },
    { id:'brent',      name:'브렌트유',     unit:'USD/bbl', category:'원자재' },
    { id:'copper',     name:'구리 가격',    unit:'USD/ton', category:'원자재' },
    { id:'gold',       name:'금 가격',      unit:'USD/oz',  category:'원자재' },
    { id:'vix',        name:'VIX',          unit:'pt',      category:'심리' },
  ],
  market: [
    { id:'kospi',  name:'KOSPI',        unit:'pt',      category:'주가' },
    { id:'kosdaq', name:'KOSDAQ',       unit:'pt',      category:'주가' },
    { id:'sp500',  name:'S&P 500',      unit:'pt',      category:'주가' },
    { id:'nasdaq', name:'NASDAQ',       unit:'pt',      category:'주가' },
    { id:'vix',    name:'VIX',          unit:'pt',      category:'심리' },
    { id:'dxy',    name:'달러인덱스',   unit:'pt',      category:'환율' },
    { id:'usdkrw', name:'원/달러 환율', unit:'원',      category:'환율' },
    { id:'us_10y', name:'미국 10년물',  unit:'%',       category:'금리' },
    { id:'wti',    name:'WTI 유가',     unit:'USD/bbl', category:'원자재' },
  ],
}

const SCOPE_OPTIONS = [
  { id:'domestic', label:'국내 중심',    desc:'국내 매크로 지표 우선' },
  { id:'global',   label:'글로벌 중심',  desc:'글로벌·시장 지표 우선' },
  { id:'both',     label:'국내 + 글로벌', desc:'전체 종합 분석' },
]

const CAT_LABEL = { domestic:'국내 매크로', global:'글로벌 매크로', market:'시장지표' }

const TREND_COLOR = { '↑':'text-green-600', '↓':'text-red-500', '→':'text-gray-500' }

function fmtVal(v, unit) {
  if (v == null) return '—'
  if (unit === '원' || unit === 'pt' || unit === 'USD/ton' || unit === 'USD/oz')
    return v.toLocaleString()
  return String(v)
}
function fmtChange(v) {
  if (v == null) return '—'
  return (v > 0 ? '+' : '') + v
}

// ── 체크박스 카테고리 그룹 ──────────────────────────────────────────────
function CheckGroup({ catKey, items, selected, onToggle, onToggleAll }) {
  const ids = items.map(i => i.id)
  const allChecked = ids.every(id => selected.has(id))
  const anyChecked = ids.some(id => selected.has(id))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#0D1B2A] uppercase tracking-wider">
          {CAT_LABEL[catKey]}
        </span>
        <button onClick={() => onToggleAll(ids, !allChecked)}
          className="text-[10px] text-[#4A9FD4] hover:underline">
          {allChecked ? '전체 해제' : '전체 선택'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {items.map(item => (
          <label key={item.id}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border cursor-pointer text-xs transition-all
              ${selected.has(item.id)
                ? 'border-[#1E3A5F] bg-[#E8F4FD] text-[#0D1B2A] font-medium'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
            <input type="checkbox" className="w-3 h-3 accent-[#1E3A5F]"
              checked={selected.has(item.id)}
              onChange={() => onToggle(item.id)} />
            <span className="truncate">{item.name}</span>
            <span className="text-[9px] text-gray-400 shrink-0">{item.unit}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── 지표 결과 테이블 ──────────────────────────────────────────────────────
function IndicatorTable({ indicators }) {
  if (!indicators || Object.keys(indicators).length === 0) return null
  const rows = Object.entries(indicators)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[#F0F4F8]">
            {['지표','현재값','기준일','전월대비','전년대비','추세'].map(h => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([id, d], i) => (
            <tr key={id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                {d.name}
                {(d.source === 'mock' || d.source === 'no_source') && (
                  <span className="ml-1 text-[9px] text-amber-500 bg-amber-50 px-1 rounded">참고값</span>
                )}
                {d.from_cache && (
                  <span className="ml-1 text-[9px] text-blue-400 bg-blue-50 px-1 rounded">캐시</span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-gray-900 whitespace-nowrap">
                {fmtVal(d.value, d.unit)} <span className="text-[10px] text-gray-400">{d.unit}</span>
              </td>
              <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{d.date || '—'}</td>
              <td className={`px-3 py-2 font-mono whitespace-nowrap ${d.mom > 0 ? 'text-green-600' : d.mom < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {fmtChange(d.mom)}
              </td>
              <td className={`px-3 py-2 font-mono whitespace-nowrap ${d.yoy > 0 ? 'text-green-600' : d.yoy < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {fmtChange(d.yoy)}
              </td>
              <td className={`px-3 py-2 text-base ${TREND_COLOR[d.trend] || 'text-gray-400'}`}>
                {d.trend || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function MacroDealPanel() {
  const [subTab, setSubTab] = useState('indicators')
  const [scope, setScope]       = useState('both')
  const [selected, setSelected] = useState(new Set())
  const [sector, setSector]     = useState('')
  const [company, setCompany]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [elapsed, setElapsed]   = useState(0)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [showAll, setShowAll]   = useState(false)
  const [insightOpen, setInsightOpen] = useState(false)
  const [insightInit, setInsightInit] = useState({})

  // 범위 변경 시 관련 카테고리 pre-fill 없이 유지 (사용자 선택 자유)
  const toggleOne = useCallback(id => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])

  const toggleAll = useCallback((ids, check) => {
    setSelected(prev => {
      const n = new Set(prev)
      ids.forEach(id => check ? n.add(id) : n.delete(id))
      return n
    })
  }, [])

  const clearAll = () => setSelected(new Set())

  // 표시할 카탈로그 섹션 (범위에 따라 순서 조정)
  const visibleCats = scope === 'domestic'
    ? ['domestic']
    : scope === 'global'
    ? ['global', 'market']
    : ['domestic', 'global', 'market']

  const handleRun = async (forceRefresh = false) => {
    setLoading(true)
    setResult(null)
    setError(null)
    setElapsed(0)
    const t0 = Date.now()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now()-t0)/1000)), 1000)
    try {
      const res = await fetch(`${API}/api/macro/analyze`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          scope,
          selected_indicators: [...selected],
          sector,
          company_name: company,
          use_default_if_empty: true,
          force_refresh: forceRefresh,
        }),
      })
      if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)
      const data = await res.json()
      setResult(data)
    } catch(e) {
      setError(e.message)
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  const openInsight = () => {
    setInsightInit({
      company_name: company || '',
      sector: sector || '',
      source_type: 'Macro',
      author: '이기준',
      key_content: result?.report
        ? result.report.split('\n').slice(0,8).join('\n')
        : '',
    })
    setInsightOpen(true)
  }

  const selectedCount = selected.size

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0D1B2A]">매크로 현황</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            지표를 선택하지 않으면 국내/글로벌 대표 지표를 기준으로 전체 매크로 동향을 요약합니다.
          </p>
        </div>
        <span className="text-[10px] text-[#4A9FD4] bg-[#E8F4FD] px-2 py-0.5 rounded font-medium shrink-0">
          Claude CLI · ECOS · FRED
        </span>
      </div>

      {/* 섹션 탭 */}
      <div className="flex gap-1 bg-[#0D1B2A] rounded-xl p-1">
        {[
          { id: 'indicators', label: '지표 분석' },
          { id: 'news',       label: 'Macro News Brief' },
        ].map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={'flex-1 py-2 rounded-lg text-xs font-semibold transition-all ' +
              (subTab === t.id ? 'bg-white text-[#0D1B2A]' : 'text-[#8BA3BB] hover:text-white')}>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'news' && (
        <MacroNewsBriefPanel macroData={result?.indicators} sector={sector} />
      )}

      {subTab === 'indicators' && <>

      {/* 설정 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">

        {/* 분석 범위 */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">분석 범위</p>
          <div className="flex flex-wrap gap-2">
            {SCOPE_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setScope(s.id)}
                title={s.desc}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                style={scope === s.id
                  ? { backgroundColor:'#0D1B2A', color:'#E8F4FD', borderColor:'#0D1B2A' }
                  : { backgroundColor:'white', color:'#6B7280', borderColor:'#E5E7EB' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 지표 선택 */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              분석 지표 선택
              {selectedCount > 0 && (
                <span className="ml-2 text-[#4A9FD4] normal-case font-medium">
                  {selectedCount}개 선택됨
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              {selectedCount > 0 && (
                <button onClick={clearAll} className="text-[10px] text-red-400 hover:underline">
                  전체 해제
                </button>
              )}
              <button onClick={() => setShowAll(v => !v)}
                className="text-[10px] text-gray-400 hover:text-gray-600">
                {showAll ? '▲ 접기' : '▼ 펼치기'}
              </button>
            </div>
          </div>

          {selectedCount === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              지표를 선택하지 않으면 <strong>대표 지표 기준 종합 분석</strong>이 실행됩니다.
            </div>
          )}

          {showAll && (
            <div className="space-y-5">
              {visibleCats.map(cat => (
                <CheckGroup key={cat} catKey={cat}
                  items={CATALOG[cat]}
                  selected={selected}
                  onToggle={toggleOne}
                  onToggleAll={toggleAll} />
              ))}
              {scope === 'both' && (
                <p className="text-[10px] text-gray-400">
                  * 국내+글로벌 범위에서 VIX·달러인덱스·원달러환율·미국10년물은 글로벌·시장지표 양쪽에 포함됩니다.
                </p>
              )}
            </div>
          )}

          {!showAll && selectedCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[...selected].map(id => {
                const meta = Object.values(CATALOG).flat().find(i => i.id === id)
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8F4FD] text-[#1E3A5F] rounded text-[10px] font-medium">
                    {meta?.name || id}
                    <button onClick={() => toggleOne(id)} className="text-[#4A9FD4] hover:text-red-400">×</button>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* 산업·기업 (선택) */}
        <div className="px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">선택 대상 (Sector Sensitivity 강화)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label:'산업', value:sector, onChange:setSector, placeholder:'예) 반도체, 2차전지, 바이오, 부동산' },
              { label:'기업', value:company, onChange:setCompany, placeholder:'예) 삼성전자, SK하이닉스' },
            ].map(f => (
              <div key={f.label} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                <input type="text" value={f.value} onChange={e => f.onChange(e.target.value)}
                  placeholder={f.placeholder}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
              </div>
            ))}
          </div>
        </div>

        {/* 실행 버튼 */}
        <div className="px-5 py-4 flex flex-wrap items-center gap-3">
          <button onClick={() => handleRun(false)} disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={loading
              ? { backgroundColor:'#E5E7EB', color:'#9CA3AF', cursor:'not-allowed' }
              : { backgroundColor:'#0D1B2A', color:'#E8F4FD' }}>
            {loading ? `분석 중… (${elapsed}s)` : '매크로 분석 생성'}
          </button>
          {result && (
            <button onClick={() => handleRun(true)} disabled={loading}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
              새로고침 (API 재조회)
            </button>
          )}
          {loading && (
            <span className="text-xs text-gray-400">
              {selectedCount > 0 ? '선택 지표 기준' : '대표 지표 기준'} 분석 중 — Claude CLI 작성 시간 포함 약 2~3분 소요
            </span>
          )}
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div className="space-y-4">

          {/* 결과 헤더 배너 */}
          <div className="flex items-center justify-between bg-[#0D1B2A] rounded-xl px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm font-semibold text-white">
                {result.analysis_type}
              </span>
              {result.sector && (
                <span className="text-[10px] bg-[#1E3A5F] text-[#7EB3E8] px-2 py-0.5 rounded">
                  {result.sector}
                </span>
              )}
              {(result.any_mock || result.any_no_source) && (
                <span className="text-[10px] bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded">
                  참고값 포함
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{result.data_date}</span>
              <button onClick={openInsight}
                className="text-[10px] bg-[#1E3A5F] text-[#7EB3E8] px-3 py-1 rounded hover:bg-[#2E5A8F] transition-colors">
                인사이트로 저장
              </button>
            </div>
          </div>

          {/* 지표 데이터 테이블 */}
          {result.indicators && Object.keys(result.indicators).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-[#F8FAFC]">
                <span className="text-sm font-semibold text-gray-700">Selected Indicators</span>
                <span className="ml-2 text-xs text-gray-400">{Object.keys(result.indicators).length}개 지표</span>
              </div>
              <div className="p-4">
                <IndicatorTable indicators={result.indicators} />
              </div>
              {(result.any_mock || result.any_no_source) && (
                <div className="px-5 pb-3 text-[10px] text-amber-600">
                  {result.any_no_source && <span>⚠ KOSPI/KOSDAQ 등 일부 지표는 무료 실시간 API 가 출사되지 않아 내부 참고값을 사용했습니다.</span>} {result.any_mock && <span>⚠ API 키 설정 후 다시 불러옵니다. ECOS/FRED 키 확인 후 찐 시 세로고침 버튼을 눌러세요.</span>}
                </div>
              )}
            </div>
          )}

          {/* Claude 분석 리포트 */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-[#F8FAFC]">
              <span className="text-sm font-semibold text-gray-700">Macro Analysis Report</span>
              <button onClick={() => {
                const blob = new Blob([result.report], { type:'text/markdown;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `macro_${result.scope}_${result.data_date?.replace(/[년월일 ]/g,'_').trim()}.md`
                a.click()
                URL.revokeObjectURL(url)
              }} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-2 py-1">
                .md 다운로드
              </button>
            </div>
            <div className="px-6 py-5">
              <SimpleMarkdown content={result.report} />
            </div>
          </div>

        </div>
      )}

      </> }

      <InsightModal
        open={insightOpen}
        onClose={() => setInsightOpen(false)}
        onSaved={() => setInsightOpen(false)}
        initial={insightInit}
      />
    </div>
  )
}

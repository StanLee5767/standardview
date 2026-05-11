import { useState } from 'react'
import { API, CO_COLORS } from '../App.jsx'
import SimpleMarkdown from './SimpleMarkdown.jsx'
import InsightModal from './InsightModal.jsx'

const DEAL_TYPES = ['VC', 'M&A', 'PE', 'IPO', 'CFO']

const SIGNAL_META = {
  'Strong Buy': { bg: '#E8FBF3', text: '#05C072', border: '#6EE7B7', icon: '🟢' },
  'Watch':      { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: '🟡' },
  'Caution':    { bg: '#FFF4ED', text: '#EA580C', border: '#FDBA74', icon: '🟠' },
  'Pass':       { bg: '#FFF0F1', text: '#DC2626', border: '#FECACA', icon: '🔴' },
}

const POS_META = {
  'Leader':     { bg: '#E8FBF3', text: '#05C072', border: '#6EE7B7' },
  'Challenger': { bg: '#EFF6FF', text: '#3182F6', border: '#BFDBFE' },
  'Niche':      { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  'Vulnerable': { bg: '#FFF0F1', text: '#DC2626', border: '#FECACA' },
}

const DEAL_TYPE_COLORS = {
  VC: '#7C3AED', 'M&A': '#3182F6', PE: '#059669', IPO: '#D97706', CFO: '#6B7684',
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

function ActionBtn({ icon, label, view, loading, activeView, onClick }) {
  const isLoading = loading === view
  const isActive  = activeView === view
  return (
    <button
      onClick={onClick}
      disabled={!!loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed"
      style={isActive
        ? { backgroundColor: '#191F28', color: '#fff' }
        : { backgroundColor: '#F2F4F6', color: '#374151' }}
    >
      {isLoading ? <Spinner /> : icon}
      {label}
    </button>
  )
}

// ── Sub-results ────────────────────────────────────────────────────────────────
function SignalResult({ data, onSave }) {
  const meta = SIGNAL_META[data.signal] || SIGNAL_META['Watch']
  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-shrink-0 px-6 py-4 rounded-2xl border-2 text-center min-w-[130px]"
             style={{ backgroundColor: meta.bg, borderColor: meta.border }}>
          <div className="text-3xl mb-1.5">{meta.icon}</div>
          <div className="font-bold text-base" style={{ color: meta.text }}>{data.signal}</div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-gray-900 mb-1">{data.summary}</p>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">{data.timing}</p>
          {data.deal_types?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">적합 딜</span>
              {data.deal_types.map(t => (
                <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                      style={{ backgroundColor: DEAL_TYPE_COLORS[t] || '#6B7684' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.reasons?.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">근거</p>
          {data.reasons.map((r, i) => (
            <div key={i} className="flex gap-2.5 text-sm text-gray-700">
              <span className="text-gray-300 flex-shrink-0 font-bold mt-0.5">—</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {onSave && (
        <div>
          <button onClick={() => onSave({
            source_type:  'AI 분析',
            source_title: `Deal Signal: ${data.signal}`,
            key_content:  `${data.signal} — ${data.summary}\n${data.timing || ''}`,
          })}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl
                       bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            인사이트로 저장
          </button>
        </div>
      )}
    </div>
  )
}

function RadarCard({ icon, title, text, items, itemColor }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{icon} {title}</p>
      {text && <p className="text-sm text-gray-700 leading-relaxed">{text}</p>}
      {items && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="flex-shrink-0 font-bold" style={{ color: itemColor }}>·</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RadarResult({ data }) {
  const posMeta = POS_META[data.positioning] || POS_META['Challenger']
  return (
    <div className="px-6 py-5 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-xl border-2 font-bold text-sm"
              style={{ backgroundColor: posMeta.bg, color: posMeta.text, borderColor: posMeta.border }}>
          {data.positioning}
        </span>
        <div>
          <p className="font-bold text-gray-900">{data.industry}</p>
          <p className="text-xs text-gray-500">{data.positioning_text}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RadarCard icon="📈" title="시장 동학"  text={data.market_dynamics} />
        <RadarCard icon="🛡"  title="경쟁 해자"  text={data.moat} />
        <RadarCard icon="🚀" title="성장 동력"  items={data.growth_vectors} itemColor="#05C072" />
        <RadarCard icon="⚠️" title="주요 위협"  items={data.threats}        itemColor="#F04452" />
      </div>
    </div>
  )
}

function MemoResult({ content, filename, onSave }) {
  const download = (ext) => {
    const mimeType = ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8'
    const blob = new Blob([content], { type: mimeType })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = (filename || 'deal_memo').replace('.md', `.${ext}`)
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs text-gray-400 font-medium">Claude AI 생성 Deal Memo</p>
        <div className="flex gap-2">
          {onSave && (
            <button onClick={() => onSave({
              source_type:  'Deal Memo',
              source_title: filename || 'Deal Memo',
              key_content:  content.slice(0, 500),
            })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                         bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition">
              + 인사이트 저장
            </button>
          )}
          <button onClick={() => download('md')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                       bg-gray-900 text-white hover:bg-gray-700 transition-colors">
            ⬇ .md
          </button>
          <button onClick={() => download('txt')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                       bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
            ⬇ .txt
          </button>
        </div>
      </div>
      <div className="border border-gray-100 rounded-2xl p-6 bg-white max-h-[640px] overflow-y-auto
                      shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        <SimpleMarkdown content={content} />
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────────
export default function DealIntelligencePanel({ corps, yearly, active }) {
  const [selectedCi, setSelectedCi] = useState(active[0] ?? 0)
  const [dealType,   setDealType]   = useState('M&A')
  const [loading,    setLoading]    = useState(null)
  const [activeView, setActiveView] = useState(null)
  const [signalData, setSignalData] = useState(null)
  const [radarData,  setRadarData]  = useState(null)
  const [memoData,   setMemoData]   = useState(null)
  const [memoFile,   setMemoFile]   = useState(null)
  const [error,      setError]      = useState(null)
  const [insightOpen, setInsightOpen] = useState(false)
  const [insightInit, setInsightInit] = useState({})

  const corp       = corps[selectedCi]
  const corpYearly = yearly?.[selectedCi] || {}

  const openInsight = (prefill = {}) => {
    setInsightInit({
      company_name: corp?.corp_name || '',
      source_type:  'AI 분析',
      ...prefill,
    })
    setInsightOpen(true)
  }

  async function callApi(path, body, onSuccess, view) {
    setLoading(view)
    setError(null)
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      onSuccess(await res.json())
      setActiveView(view)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  const handleSignal = () =>
    callApi('/api/deal-signal',
      { corp_name: corp.corp_name, yearly: corpYearly },
      setSignalData, 'signal')

  const handleRadar = () =>
    callApi('/api/industry-radar',
      { corp_name: corp.corp_name, yearly: corpYearly },
      setRadarData, 'radar')

  const handleMemo = () =>
    callApi('/api/deal-memo',
      { corp_name: corp.corp_name, deal_type: dealType, yearly: corpYearly },
      (data) => { setMemoData(data.memo); setMemoFile(data.filename) },
      'memo')

  if (!corp) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg">
              💼
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Deal Intelligence</h3>
              <p className="text-slate-400 text-xs">VC · M&amp;A · PE · IPO · CFO 딜 검토 인사이트</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 text-xs font-medium">대상</span>
            {active.map(i => (
              <button key={i}
                onClick={() => { setSelectedCi(i); setActiveView(null) }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={selectedCi === i
                  ? { backgroundColor: CO_COLORS[i], color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                {corps[i].corp_name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 액션 바 */}
      <div className="px-6 py-3.5 flex flex-wrap gap-2 items-center border-b border-gray-100 bg-gray-50/60">
        <ActionBtn icon="📊" label="Deal Signal"    view="signal" loading={loading} activeView={activeView} onClick={handleSignal} />
        <ActionBtn icon="🔭" label="Industry Radar" view="radar"  loading={loading} activeView={activeView} onClick={handleRadar}  />
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <select value={dealType} onChange={e => setDealType(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-700 bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
            {DEAL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <ActionBtn icon="📋" label="Deal Memo 생성" view="memo" loading={loading} activeView={activeView} onClick={handleMemo} />
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="px-6 py-12 flex flex-col items-center gap-3 text-gray-500">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Spinner />
          </div>
          <p className="text-sm font-medium">
            {loading === 'memo' ? 'Deal Memo 생성 중… (30초~2분)' : 'AI 분석 중…'}
          </p>
          <p className="text-xs text-gray-400">Claude CLI를 통해 분석합니다</p>
        </div>
      )}

      {/* 결과 */}
      {!loading && activeView === 'signal' && signalData && <SignalResult data={signalData} onSave={openInsight} />}
      {!loading && activeView === 'radar'  && radarData  && <RadarResult  data={radarData} />}
      {!loading && activeView === 'memo'   && memoData   && (
        <MemoResult content={memoData} filename={memoFile} onSave={openInsight} />
      )}

      {/* 초기 상태 */}
      {!loading && !activeView && !error && (
        <div className="px-6 py-10 text-center">
          <p className="text-gray-400 text-sm">위 버튼을 눌러 딜 인텔리전스를 생성하세요</p>
          <p className="text-gray-300 text-xs mt-1">Claude CLI 미연결 시 재무 데이터 기반 Mock 결과를 반환합니다</p>
        </div>
      )}

      {/* InsightModal — 메인 컴포넌트에만 배치 */}
      <InsightModal
        open={insightOpen}
        onClose={() => setInsightOpen(false)}
        onSaved={() => setInsightOpen(false)}
        initial={insightInit}
      />
    </div>
  )
}

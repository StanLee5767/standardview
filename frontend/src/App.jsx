import { useState, useCallback } from 'react'
import SearchSection from './components/SearchSection.jsx'
import ResultSection from './components/ResultSection.jsx'
import IndustryIntelligencePanel from './components/IndustryIntelligencePanel.jsx'
import InsightLogPanel from './components/InsightLogPanel.jsx'
import MacroDealPanel from './components/MacroDealPanel.jsx'

export const API = window.location.hostname === 'localhost'
  ? 'http://localhost:8002'
  : ''

export const CO_COLORS = ['#1E3A5F', '#C0392B', '#1A6B3C']

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          © 2026 이기준. Built by Kijun Lee.
        </p>
        <p className="text-xs text-gray-400 text-center sm:text-right">
          Standard View — DART Financial Analysis &amp; Industry Intelligence.
        </p>
      </div>
    </footer>
  )
}

const NAV = [
  { id: 'finance',  label: '재무 분석' },
  { id: 'industry', label: '산업 인텔리전스' },
  { id: 'macro',    label: 'Macro Deal' },
  { id: 'insight',  label: '인사이트 로그' },
]

export default function App() {
  const [page, setPage]           = useState('finance')
  const [corps, setCorps]         = useState([null, null, null])
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults]     = useState(null)
  const [opinions, setOpinions]   = useState([null, null, null])
  const [loadingOp, setLoadingOp] = useState([false, false, false])
  const [claudeOk, setClaudeOk]   = useState(true)
  const [error, setError]         = useState(null)
  const [dartStatus, setDartStatus] = useState(null)

  const handleAnalyze = useCallback(async () => {
    const active = corps.filter(Boolean)
    if (active.length === 0) return
    setAnalyzing(true)
    setResults(null)
    setDartStatus(null)
    setOpinions([null, null, null])
    setError(null)
    try {
      const res = await fetch(`${API}/api/analyze-multi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corps }),
      })
      if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)
      const data = await res.json()
      setResults(data)
      setDartStatus(data.dart_status || null)
    } catch (e) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }, [corps])

  const handleOpinion = useCallback(async (ci) => {
    if (!results || !corps[ci]) return
    setLoadingOp(prev => { const n = [...prev]; n[ci] = true; return n })
    try {
      const res = await fetch(`${API}/api/opinion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corp_name: corps[ci].corp_name, yearly: results.yearly[ci] }),
      })
      if (res.status === 503) { setClaudeOk(false); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setOpinions(prev => { const n = [...prev]; n[ci] = data; return n })
    } catch {
      // 개별 오류 무시
    } finally {
      setLoadingOp(prev => { const n = [...prev]; n[ci] = false; return n })
    }
  }, [results, corps])

  const handleDownload = useCallback(() => {
    if (!results?.filename) return
    window.location.href = `${API}/api/download/${results.filename}`
  }, [results])

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">

      {/* ── 헤더 ── */}
      <header className="bg-[#0D1B2A] border-b border-[#1E2D3D] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">

          {/* 로고 */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 rounded flex items-center justify-center bg-[#1E3A5F] border border-[#2E5A8F]">
              <svg className="w-4 h-4 text-[#7EB3E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight tracking-wide">Standard View</h1>
              <p className="text-[10px] text-[#7EB3E8] leading-none mt-0.5">
                DART 재무분석 · 산업 인텔리전스 · Deal Memo
              </p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-5 w-px bg-[#1E2D3D]" />

          {/* 탭 네비게이션 */}
          <nav className="flex items-center gap-0.5">
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                className="px-4 py-2 rounded text-xs font-semibold tracking-wide transition-all"
                style={page === n.id
                  ? { backgroundColor: '#1E3A5F', color: '#E8F4FD', borderBottom: '2px solid #4A9FD4' }
                  : { color: '#8BA3BB', backgroundColor: 'transparent', borderBottom: '2px solid transparent' }}>
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── 재무 분석 ── */}
      {page === 'finance' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          <SearchSection corps={corps} setCorps={setCorps} onAnalyze={handleAnalyze} analyzing={analyzing} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600">
              ⚠ {error}
            </div>
          )}

          {!claudeOk && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
              Claude CLI가 설치되지 않아 AI 의견을 생성할 수 없습니다.
              <br />
              <span className="text-xs text-amber-600 mt-1 block">설치: npm install -g @anthropic-ai/claude-code → claude login</span>
            </div>
          )}

          {results && (
            <ResultSection
              corps={corps}
              yearly={results.yearly}
              dartStatus={dartStatus}
              filename={results.filename}
              opinions={opinions}
              loadingOp={loadingOp}
              claudeOk={claudeOk}
              onOpinion={handleOpinion}
              onDownload={handleDownload}
            />
          )}
        </main>
      )}

      {/* ── 산업 인텔리전스 ── */}
      {page === 'industry' && (
        <div className="flex-1">
          <IndustryIntelligencePanel />
        </div>
      )}

      {/* ── Macro Deal Intelligence ── */}
      {page === 'macro' && (
        <div className="flex-1">
          <MacroDealPanel />
        </div>
      )}

      {/* ── 인사이트 로그 ── */}
      {page === 'insight' && (
        <div className="flex-1">
          <InsightLogPanel />
        </div>
      )}

      <Footer />
    </div>
  )
}

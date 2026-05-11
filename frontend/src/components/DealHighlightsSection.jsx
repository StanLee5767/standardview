import { useState } from 'react'
import { API } from '../App.jsx'
import InsightModal from './InsightModal.jsx'
import SimpleMarkdown from './SimpleMarkdown.jsx'

/* ── 상수 ─────────────────────────────────────────────────────────────────── */
const DEAL_TYPES = [
  'M&A', 'VC 투자유치', 'PE / 바이아웃', 'IPO / Pre-IPO',
  '자본조달', '구조조정', 'JV / 전략적 제휴', '기술이전 / 라이선스',
  '대규모 공급계약', '매각', '기타 Deal Issue',
]

const SCORE_META = {
  5: { label: '★★★★★', color: '#DC2626', bg: '#FFF0F1', desc: '직접 딜 이슈' },
  4: { label: '★★★★',  color: '#D97706', bg: '#FFFBEB', desc: '딜 가능성 높음' },
  3: { label: '★★★',   color: '#3182F6', bg: '#EFF6FF', desc: '간접 관련' },
  2: { label: '★★',    color: '#6B7684', bg: '#F9FAFB', desc: '약한 관련' },
  1: { label: '★',     color: '#9CA3AF', bg: '#F9FAFB', desc: '일반 뉴스' },
}

const DEAL_TYPE_COLOR = {
  'M&A':              '#3182F6',
  'VC 투자유치':      '#7C3AED',
  'PE / 바이아웃':    '#1A6B3C',
  'IPO / Pre-IPO':    '#D97706',
  '자본조달':         '#0891B2',
  '구조조정':         '#DC2626',
  'JV / 전략적 제휴': '#059669',
  '기술이전 / 라이선스': '#7C3AED',
  '대규모 공급계약':  '#374151',
  '매각':             '#B45309',
  '기타 Deal Issue':  '#6B7684',
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

function LangBadge({ lang }) {
  return lang === 'en'
    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'#F0FDF4', color:'#16A34A' }}>EN</span>
    : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background:'#EFF6FF', color:'#3182F6' }}>KO</span>
}

/* ── Deal Memo 미니 모달 ───────────────────────────────────────────────────── */
function DealMemoModal({ article, sector, onClose }) {
  const [memo, setMemo]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = async () => {
    setLoading(true); setError(null)
    try {
      const title   = article.translated_title || article.title || ''
      const summary = article.translated_summary || article.description || ''
      const res = await fetch(`${API}/api/article-deal-memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, summary,
          url:              article.url || '',
          deal_type:        article.deal_type || '',
          deal_implication: article.deal_implication || '',
          company_name:     (article.related_companies || []).join(', '),
          sector,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMemo(data.memo)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const download = (ext) => {
    const blob = new Blob([memo], { type: ext === 'md' ? 'text/markdown' : 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `deal_note_${Date.now()}.${ext}`; a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh]
                      flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 text-base">💼 Deal Note 생성</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {article.translated_title || article.title}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!memo && !loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <p className="text-sm text-gray-500">
                기사 제목·요약 기반으로 Deal Note를 생성합니다.<br/>
                <span className="text-xs text-gray-400">(기사 원문 미열람 — 추정 내용은 확인 필요로 표기됩니다)</span>
              </p>
              <button onClick={generate}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: '#0D1B2A' }}>
                Deal Note 생성
              </button>
              {error && <p className="text-xs text-red-500">⚠ {error}</p>}
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Spinner /><p className="text-sm text-gray-400">생성 중… (30초~2분)</p>
            </div>
          )}
          {memo && (
            <div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => download('md')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-700 transition">
                  ⬇ .md
                </button>
                <button onClick={() => download('txt')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                  ⬇ .txt
                </button>
              </div>
              <div className="border border-gray-100 rounded-2xl p-5 bg-white">
                <SimpleMarkdown content={memo} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Deal Highlight 카드 ───────────────────────────────────────────────────── */
function DealCard({ article, sector, onSaveInsight }) {
  const [expanded, setExpanded]   = useState(false)
  const [memoOpen, setMemoOpen]   = useState(false)
  const [insightOpen, setInsightOpen] = useState(false)

  const score   = article.deal_relevance_score || 3
  const sm      = SCORE_META[score] || SCORE_META[3]
  const dtColor = DEAL_TYPE_COLOR[article.deal_type] || '#6B7684'
  const title   = article.translated_title || article.title || ''
  const desc    = article.translated_summary || article.description || ''
  const impact  = score >= 4 ? 'High' : score === 3 ? 'Medium' : 'Low'

  const insightInitial = {
    created_at:   new Date().toISOString().slice(0, 10),
    author:       '이기준',
    source_type:  '뉴스',
    source_title: title,
    source_url:   article.url || '',
    key_content:  desc,
    sector,
    company_name: (article.related_companies || []).join(', '),
    impact_level: impact,
    tags:         article.deal_type || '',
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3
                      hover:border-gray-200 hover:shadow-sm transition-all">

        {/* 상단: 배지 행 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                style={{ backgroundColor: dtColor }}>
            {article.deal_type || '기타'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: sm.bg, color: sm.color }}>
            {sm.label} {score}점
          </span>
          <LangBadge lang={article.source_language || 'ko'} />
          <span className="ml-auto text-[10px] text-gray-400">{article.published_at || ''}</span>
        </div>

        {/* 제목 */}
        <div>
          <p className={`text-sm font-semibold text-gray-800 break-words leading-snug
                        ${!expanded ? 'line-clamp-2' : ''}`}>
            {title}
          </p>
          {article.source_language === 'en' && article.title !== title && (
            <p className="text-[10px] text-gray-400 mt-0.5 break-words">{article.title}</p>
          )}
          {article.source && (
            <p className="text-[10px] text-gray-400 mt-1 font-medium">{article.source}</p>
          )}
        </div>

        {/* 왜 딜 관련인지 */}
        {article.why_deal_related && (
          <p className="text-[11px] text-gray-500 italic">{article.why_deal_related}</p>
        )}

        {/* 딜 시사점 */}
        {article.deal_implication && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
              Deal Implication
            </p>
            <p className={`text-xs text-gray-700 leading-relaxed break-words
                          ${!expanded ? 'line-clamp-3' : ''}`}>
              {article.deal_implication}
            </p>
          </div>
        )}

        {/* 관련 기업 */}
        {article.related_companies?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {article.related_companies.map((c, i) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-lg
                                       bg-[#EFF6FF] text-[#3182F6]">{c}</span>
            ))}
          </div>
        )}

        {/* 추가 확인사항 */}
        {expanded && article.next_checkpoints?.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">
              추가 확인사항
            </p>
            <ul className="space-y-1">
              {article.next_checkpoints.map((c, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700">
                  <span className="text-blue-400 shrink-0">□</span>{c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 더보기/접기 */}
        <button onClick={() => setExpanded(e => !e)}
          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
          {expanded ? '접기' : '더보기 (확인사항)'}
        </button>

        {/* 버튼 행 */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50 flex-wrap">
          {article.url && (
            <a href={article.url} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg
                          bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              원문
            </a>
          )}
          <button onClick={() => setMemoOpen(true)}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg
                       bg-[#0D1B2A] text-white hover:bg-[#1E3A5F] transition">
            💼 Deal Note
          </button>
          <button onClick={() => setInsightOpen(true)}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg
                       bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition">
            + 인사이트
          </button>
        </div>
      </div>

      {memoOpen && (
        <DealMemoModal article={article} sector={sector} onClose={() => setMemoOpen(false)} />
      )}
      <InsightModal
        open={insightOpen}
        onClose={() => setInsightOpen(false)}
        onSaved={() => setInsightOpen(false)}
        initial={insightInitial}
      />
    </>
  )
}

/* ── 메인 섹션 컴포넌트 ────────────────────────────────────────────────────── */
export default function DealHighlightsSection({ dealHighlights = [], totalNews = 0, sector = '' }) {
  const [filterType,  setFilterType]  = useState('')
  const [filterScore, setFilterScore] = useState(0)
  const [filterLang,  setFilterLang]  = useState('')

  if (!dealHighlights.length) return null

  // 딜 유형별 카운트
  const typeCounts = dealHighlights.reduce((acc, a) => {
    const t = a.deal_type || '기타'
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  // 필터 적용
  const filtered = dealHighlights.filter(a => {
    if (filterType  && a.deal_type !== filterType)                    return false
    if (filterScore && a.deal_relevance_score < filterScore)          return false
    if (filterLang  && (a.source_language || 'ko') !== filterLang)   return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* 헤더 배너 */}
      <div className="bg-gradient-to-r from-[#0D1B2A] to-[#1E3A5F] rounded-2xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-[#7EB3E8] uppercase tracking-wider mb-1">
              Deal Highlights
            </p>
            <p className="text-white font-bold text-base">
              수집 뉴스 {totalNews}건 중 딜 관련 이슈 {dealHighlights.length}건
            </p>
            <p className="text-[#8BA3BB] text-xs mt-1">
              키워드·AI 분석 기반 자동 분류 — 원문 확인 권장
            </p>
          </div>
          {/* 딜 유형 분포 */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeCounts).map(([type, cnt]) => (
              <span key={type} className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#E2E8F0' }}>
                {type} {cnt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex flex-wrap gap-3 items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase">필터</span>

        {/* 딜 유형 */}
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">딜 유형 전체</option>
          {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* 관련성 점수 */}
        <select value={filterScore} onChange={e => setFilterScore(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-200">
          <option value={0}>점수 전체</option>
          <option value={5}>5점 (직접 딜)</option>
          <option value={4}>4점 이상</option>
          <option value={3}>3점 이상</option>
        </select>

        {/* 언어 */}
        <div className="flex gap-1">
          {[['', '전체'], ['ko', 'KO'], ['en', 'EN']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterLang(val)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
              style={filterLang === val
                ? { backgroundColor: '#0D1B2A', color: '#fff' }
                : { backgroundColor: '#F2F4F6', color: '#6B7684' }}>
              {label}
            </button>
          ))}
        </div>

        {(filterType || filterScore || filterLang) && (
          <button onClick={() => { setFilterType(''); setFilterScore(0); setFilterLang('') }}
            className="text-[10px] text-gray-400 hover:text-gray-600 font-medium ml-auto">
            초기화
          </button>
        )}
        <span className="text-[10px] text-gray-400 ml-auto">{filtered.length}건 표시</span>
      </div>

      {/* 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-10 text-center">
          <p className="text-sm text-gray-400">필터 조건에 맞는 딜 이슈가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a, i) => (
            <DealCard key={i} article={a} sector={sector} />
          ))}
        </div>
      )}
    </div>
  )
}

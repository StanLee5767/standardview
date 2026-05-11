import { useState } from 'react'
import { API } from '../App.jsx'
import SimpleMarkdown from './SimpleMarkdown.jsx'
import InsightModal from './InsightModal.jsx'

const TOPICS = [
  { id: 'interest_rate', label: '금리/통화정책' },
  { id: 'fx',            label: '환율/달러' },
  { id: 'inflation',     label: '물가/원자재' },
  { id: 'growth',        label: '경기/GDP/소비' },
  { id: 'employment',    label: '고용' },
  { id: 'liquidity',     label: '유동성/자금시장' },
  { id: 'credit',        label: '부동산PF/크레딧' },
  { id: 'equity_market', label: '증시/위험자산' },
  { id: 'geopolitics',   label: '지정학/공급망' },
  { id: 'policy',        label: '정책/규제' },
]

const SCOPE_OPTIONS = [
  { id: 'domestic', label: '국내 중심' },
  { id: 'global',   label: '글로벌 중심' },
  { id: 'both',     label: '국내 + 글로벌' },
]

const DATE_RANGE_OPTIONS = [
  { id: '1d', label: '최근 1일' },
  { id: '1w', label: '최근 1주' },
  { id: '1m', label: '최근 1개월' },
  { id: '3m', label: '최근 3개월' },
]

const SCOPE_LABEL  = { domestic: '국내 중심', global: '글로벌 중심', both: '국내+글로벌' }
const RANGE_LABEL  = { '1d': '최근 1일', '1w': '최근 1주', '1m': '최근 1개월', '3m': '최근 3개월' }

const TOPIC_COLORS = {
  interest_rate: 'bg-blue-50 text-blue-700 border-blue-200',
  fx:            'bg-purple-50 text-purple-700 border-purple-200',
  inflation:     'bg-orange-50 text-orange-700 border-orange-200',
  growth:        'bg-green-50 text-green-700 border-green-200',
  employment:    'bg-teal-50 text-teal-700 border-teal-200',
  liquidity:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  credit:        'bg-red-50 text-red-700 border-red-200',
  equity_market: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  geopolitics:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  policy:        'bg-gray-50 text-gray-600 border-gray-200',
  other:         'bg-gray-50 text-gray-500 border-gray-100',
}

const TOPIC_LABELS = {
  interest_rate: '금리/통화정책', fx: '환율/달러', inflation: '물가/원자재',
  growth: '경기/GDP', employment: '고용', liquidity: '유동성/자금',
  credit: '부동산PF/크레딧', equity_market: '증시', geopolitics: '지정학',
  policy: '정책/규제', other: '기타',
}

const IMPACT_MAP = { 5: 'High', 4: 'High', 3: 'Medium', 2: 'Medium', 1: 'Low' }

function ImportanceDots({ score = 2 }) {
  return (
    <span className="flex gap-0.5 items-center" title={`중요도 ${score}/5`}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i <= score ? 'bg-[#4A9FD4]' : 'bg-gray-200'}`} />
      ))}
    </span>
  )
}

function ArticleCard({ article, sector, onSave }) {
  const [expanded, setExpanded] = useState(false)
  const lang   = article.source_language || 'ko'
  const topics = article.macro_topics || []
  const desc   = article.description || ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 hover:border-gray-300 transition-colors">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${lang === 'ko' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {lang === 'ko' ? 'KO' : 'EN'}
          </span>
          {topics.filter(t => t !== 'other').slice(0, 3).map(t => (
            <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded border ${TOPIC_COLORS[t] || TOPIC_COLORS.other}`}>
              {TOPIC_LABELS[t] || t}
            </span>
          ))}
          <ImportanceDots score={article.importance_score} />
        </div>

        <p className="text-[13px] font-medium text-gray-900 leading-snug">{article.title}</p>

        {desc && (
          <p className={`text-[11px] text-gray-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {desc}
          </p>
        )}

        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="font-semibold text-gray-600">{article.source}</span>
            <span>{article.published_at}</span>
            {desc.length > 140 && (
              <button onClick={() => setExpanded(v => !v)} className="text-[#4A9FD4] hover:underline">
                {expanded ? '접기' : '더보기'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {article.url && (
              <a href={article.url} target="_blank" rel="noopener noreferrer"
                 className="text-[#4A9FD4] hover:underline">원문</a>
            )}
            <button onClick={() => onSave(article)}
                    className="bg-[#1E3A5F] text-[#7EB3E8] px-2 py-0.5 rounded text-[10px] hover:bg-[#2E5A8F] transition-colors">
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MacroNewsBriefPanel({ macroData, sector }) {
  const [scope,      setScope]      = useState('both')
  const [dateRange,  setDateRange]  = useState('1w')
  const [topics,     setTopics]     = useState(new Set())
  const [keywords,   setKeywords]   = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [loading,    setLoading]    = useState(false)
  const [elapsed,    setElapsed]    = useState(0)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)
  const [insightOpen, setInsightOpen] = useState(false)
  const [insightInit, setInsightInit] = useState({})

  const toggleTopic = id => setTopics(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const openInsightForBrief = () => {
    if (!result) return
    setInsightInit({
      source_type:  'Macro News',
      author:       '이기준',
      sector:       sector || '',
      key_content:  result.report?.slice(0, 600) || '',
      source_title: `Macro News Brief — ${SCOPE_LABEL[scope]} / ${RANGE_LABEL[dateRange]}`,
      impact_level: 'Medium',
    })
    setInsightOpen(true)
  }

  const openInsightForArticle = article => {
    setInsightInit({
      source_type:  'Macro News',
      author:       '이기준',
      sector:       sector || '',
      source_title: article.title,
      source_url:   article.url || '',
      key_content:  article.description || article.title,
      impact_level: IMPACT_MAP[article.importance_score || 3] || 'Medium',
    })
    setInsightOpen(true)
  }

  const handleFetch = async (forceRefresh = false) => {
    setLoading(true); setError(null); setResult(null); setElapsed(0)
    const t0 = Date.now()
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000)
    try {
      const res = await fetch(`${API}/api/macro/news-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          topics:        [...topics],
          date_range:    dateRange,
          keywords:      keywords.split(',').map(k => k.trim()).filter(Boolean),
          max_results:   maxResults,
          macro_data:    macroData || {},
          sector:        sector || '',
          force_refresh: forceRefresh,
        }),
      })
      if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(timer); setLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── 설정 패널 ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-[#0D1B2A]">Macro News Brief</h3>

        {/* 분석 범위 */}
        <div>
          <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wide">분석 범위</p>
          <div className="flex gap-2 flex-wrap">
            {SCOPE_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setScope(o.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  scope === o.id ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                                 : 'bg-white text-gray-600 border-gray-200 hover:border-[#4A9FD4]'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 분석 기간 */}
        <div>
          <p className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wide">분석 기간</p>
          <div className="flex gap-2 flex-wrap">
            {DATE_RANGE_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setDateRange(o.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  dateRange === o.id ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#4A9FD4]'}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 매크로 주제 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">
              매크로 주제&nbsp;
              <span className="text-gray-400 normal-case font-normal">(미선택 시 기본 검색어 자동 사용)</span>
            </p>
            {topics.size > 0 && (
              <button onClick={() => setTopics(new Set())} className="text-[10px] text-gray-400 hover:text-gray-600">
                전체 해제
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => toggleTopic(t.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all ${
                  topics.has(t.id)
                    ? 'bg-[#1E3A5F] text-[#7EB3E8] border-[#2E5A8F]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#4A9FD4]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 추가 검색어 + 최대 뉴스 수 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-wide">추가 검색어 (쉼표 구분)</p>
            <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
              placeholder="예: 반도체 수출, AI 투자, chip tariff..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-300" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-wide">최대 뉴스 수</p>
            <div className="flex gap-2">
              {[10, 20, 30].map(n => (
                <button key={n} onClick={() => setMaxResults(n)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    maxResults === n ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#4A9FD4]'}`}>
                  {n}건
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button onClick={() => handleFetch(false)} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#0D1B2A] text-white hover:bg-[#1E3A5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? `뉴스 수집 및 분석 중... (${elapsed}s)` : '뉴스 기반 매크로 브리프 생성'}
          </button>
          {result && !loading && (
            <button onClick={() => handleFetch(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              새로고침
            </button>
          )}
        </div>
      </div>

      {/* ── 에러 ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600">
          ⚠ {error}
        </div>
      )}

      {/* ── 결과 ── */}
      {result && (
        <div className="space-y-4">

          {/* 결과 헤더 배너 */}
          <div className="flex items-center justify-between bg-[#0D1B2A] rounded-xl px-5 py-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">Macro News Brief</span>
              <span className="text-[10px] bg-[#1E3A5F] text-[#7EB3E8] px-2 py-0.5 rounded">
                {SCOPE_LABEL[result.scope] || result.scope}
              </span>
              <span className="text-[10px] bg-[#1E3A5F] text-[#7EB3E8] px-2 py-0.5 rounded">
                {RANGE_LABEL[result.date_range] || result.date_range}
              </span>
              {result.from_cache && (
                <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">캐시</span>
              )}
              <span className="text-[10px] text-gray-400">
                국내 {result.article_count?.ko || 0}건 · 글로벌 {result.article_count?.en || 0}건
              </span>
            </div>
            <button onClick={openInsightForBrief}
              className="text-[10px] bg-[#1E3A5F] text-[#7EB3E8] px-3 py-1 rounded hover:bg-[#2E5A8F] transition-colors whitespace-nowrap">
              인사이트로 저장
            </button>
          </div>

          {/* 뉴스 없음 경고 */}
          {!result.has_real_news && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
              뉴스 API 연결 없음 — .env에 <code className="font-mono text-xs">NAVER_CLIENT_ID/SECRET</code> 및 <code className="font-mono text-xs">NEWS_API_KEY</code>를 설정하면 실시간 뉴스를 수집합니다.
              <span className="block text-xs mt-1 text-amber-600">GDELT API는 키 없이 자동 사용되나 속도가 느릴 수 있습니다.</span>
            </div>
          )}

          {/* Claude 분석 리포트 */}
          {result.report && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <SimpleMarkdown content={result.report} />
            </div>
          )}

          {/* 참고 뉴스 목록 */}
          {result.articles && result.articles.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-[#F8FAFC] flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">참고 뉴스</span>
                <span className="text-xs text-gray-400">{result.articles.length}건</span>
              </div>

              <div className="p-4 space-y-3 max-h-[640px] overflow-y-auto">
                {/* 국내 뉴스 */}
                {result.ko_articles?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px]">KO</span>
                      국내 뉴스 {result.ko_articles.length}건
                    </p>
                    {result.ko_articles.map((a, i) => (
                      <ArticleCard key={`ko-${i}`} article={a} sector={sector} onSave={openInsightForArticle} />
                    ))}
                  </div>
                )}

                {/* 글로벌 뉴스 */}
                {result.en_articles?.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px]">EN</span>
                      글로벌 뉴스 {result.en_articles.length}건
                    </p>
                    {result.en_articles.map((a, i) => (
                      <ArticleCard key={`en-${i}`} article={a} sector={sector} onSave={openInsightForArticle} />
                    ))}
                  </div>
                )}
              </div>

              {/* 주제 태그 분포 */}
              {result.topics_found?.length > 0 && (
                <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-2">수집 뉴스의 매크로 주제</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.topics_found.filter(t => t !== 'other').map(t => (
                      <span key={t} className={`text-[10px] px-2 py-0.5 rounded border ${TOPIC_COLORS[t] || TOPIC_COLORS.other}`}>
                        {TOPIC_LABELS[t] || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <InsightModal
        open={insightOpen}
        onClose={() => setInsightOpen(false)}
        onSaved={() => setInsightOpen(false)}
        initial={insightInit}
      />
    </div>
  )
}

import { useState } from 'react'
import { API } from '../App.jsx'
import InsightModal from './InsightModal.jsx'
import DealHighlightsSection from './DealHighlightsSection.jsx'

const INDUSTRIES = [
  { group: '테크/IT',      items: ['반도체', 'AI', '클라우드/SaaS', '핀테크', '사이버보안', '게임', 'e커머스', '모빌리티'] },
  { group: '에너지/소재',  items: ['2차전지', '태양광/신재생에너지', '수소에너지', '석유화학', '철강/금속', '디스플레이'] },
  { group: '헬스케어',     items: ['바이오텍', '의료기기', '제약', '디지털헬스', 'CRO/CDMO'] },
  { group: '소비/유통',    items: ['패션/뷰티', 'F&B', '유통/물류', '엔터테인먼트/미디어', '여행/레저'] },
  { group: '금융/부동산',  items: ['은행/보험', '자산운용', '프롭테크', '인프라/건설'] },
  { group: '제조/산업재',  items: ['자동차', '항공우주/방산', '로봇/자동화', '스마트팩토리'] },
]

const SCOPE_OPTIONS = [
  { id: 'domestic',     label: '국내 중심',   desc: 'Naver 뉴스 기반' },
  { id: 'global',       label: '글로벌 포함', desc: 'Naver + 영문 뉴스' },
  { id: 'global_first', label: '글로벌 우선', desc: '영문 뉴스 중심' },
]

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

/* ── 인사이트 저장 버튼 ── */
function SaveInsightBtn({ onSave }) {
  return (
    <button onClick={e => { e.preventDefault(); e.stopPropagation(); onSave() }}
      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all shrink-0
                 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100">
      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      저장
    </button>
  )
}

function LangBadge({ lang }) {
  if (!lang) return null
  const styles = {
    ko: { bg: '#EFF6FF', color: '#3182F6', label: 'KO' },
    en: { bg: '#F0FDF4', color: '#16A34A', label: 'EN' },
  }
  const s = styles[lang] || { bg: '#F9FAFB', color: '#6B7684', label: '???' }
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function IndustryPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => setOpen(true)}
          placeholder="예: 2차전지, 반도체, 핀테크"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-300 transition" />
        <button type="button" onClick={() => setOpen(o => !o)}
          className="px-3 py-3 rounded-xl border border-gray-200 text-gray-400
                     hover:border-blue-300 hover:text-blue-500 transition" title="산업 목록">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-20
                          max-h-80 overflow-y-auto py-2">
            {INDUSTRIES.map(group => (
              <div key={group.group}>
                <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">
                  {group.group}
                </div>
                <div className="flex flex-wrap gap-1.5 px-4 py-2">
                  {group.items.map(item => (
                    <button key={item} onClick={() => { onChange(item); setOpen(false) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                 hover:bg-blue-50 hover:text-blue-600 text-gray-600 bg-gray-50"
                      style={value === item ? { backgroundColor: '#3182F6', color: '#fff' } : {}}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── 공통 카드 ────────────────────────────────────────────────────────────────── */
function Card({ title, accent = '#3182F6', children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accent }} />
        <h4 className="font-semibold text-sm text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function StringField({ value }) {
  if (!value) return null
  return <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
}

function ListField({ items, onSave }) {
  if (!items?.length) return null
  if (typeof items[0] === 'string') {
    return (
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <span className="text-gray-300 shrink-0 mt-0.5">•</span><span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        if (item.factor) {
          return (
            <div key={i} className="bg-gray-50 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.factor}</span>
                {item.level && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={item.level === '상' ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                         : item.level === '중' ? { backgroundColor: '#FEF3C7', color: '#D97706' }
                         :                      { backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                    {item.level}
                  </span>
                )}
              </div>
            </div>
          )
        }
        return <IssueCard key={i} item={item} onSave={onSave} />
      })}
    </div>
  )
}

function IssueCard({ item, onSave }) {
  const [expanded, setExpanded] = useState(false)
  const needsToggle = (item.title?.length > 60) || (item.summary?.length > 100)
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-800 break-words whitespace-normal leading-snug ${!expanded ? 'line-clamp-2' : ''}`}>
            {item.title}
          </p>
          {item.is_translated && item.original_title && (
            <p className="text-[10px] text-gray-400 mt-0.5 break-words leading-snug">{item.original_title}</p>
          )}
          {item.summary && (
            <p className={`text-xs text-gray-500 mt-1 break-words whitespace-normal leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
              {item.summary}
            </p>
          )}
          {needsToggle && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-[10px] text-blue-500 hover:text-blue-700 mt-1 font-medium">
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
        {onSave && <SaveInsightBtn onSave={onSave} />}
      </div>
    </div>
  )
}

function NewsCard({ article, onSave }) {
  const [expanded, setExpanded] = useState(false)
  const lang = article.source_language || 'ko'
  const isTranslated = article.translation_status === 'ok'
  const displayTitle = (isTranslated && article.translated_title) ? article.translated_title : article.title
  const displayDesc  = (isTranslated && article.translated_summary) ? article.translated_summary : (article.description || '')
  const needsToggle  = displayDesc.length > 100

  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer"
       className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-2">
        <LangBadge lang={lang} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-800 group-hover:text-blue-600 break-words whitespace-normal leading-snug ${!expanded ? 'line-clamp-2' : ''}`}>
            {displayTitle}
          </p>
          {isTranslated && article.title && (
            <p className="text-[10px] text-gray-400 mt-0.5 break-words leading-snug">{article.title}</p>
          )}
          {isTranslated && (
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 mt-1 rounded"
                  style={{ backgroundColor: '#F0FDF4', color: '#16A34A' }}>번역</span>
          )}
          {displayDesc && (
            <p className={`text-xs text-gray-400 mt-1 break-words whitespace-normal leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
              {displayDesc}
            </p>
          )}
          {needsToggle && (
            <button onClick={e => { e.preventDefault(); setExpanded(v => !v) }}
              className="text-[10px] text-blue-500 hover:text-blue-700 mt-1 font-medium">
              {expanded ? '접기' : '더보기'}
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {onSave && <SaveInsightBtn onSave={onSave} />}
          <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 mt-0.5 transition-colors"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {article.source && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={lang === 'en'
              ? { backgroundColor: '#F0FDF4', color: '#16A34A' }
              : { backgroundColor: '#EFF6FF', color: '#3182F6' }}>
            {article.source}
          </span>
        )}
        {article.published_at && <span className="text-[10px] text-gray-400">{article.published_at}</span>}
      </div>
    </a>
  )
}

function NewsSection({ news, koCount, enCount, onSave }) {
  const [filter, setFilter] = useState('all')
  if (!news?.length) return null
  const filtered = filter === 'all' ? news : news.filter(a => (a.source_language || 'ko') === filter)
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          참고 기사 ({news.length})
        </h4>
        {(koCount > 0 || enCount > 0) && (
          <div className="flex gap-1">
            {[
              { id: 'all', label: `전체 ${news.length}` },
              { id: 'ko',  label: `KO ${koCount}` },
              { id: 'en',  label: `EN ${enCount}` },
            ].filter(f => f.id === 'all' || (f.id === 'ko' ? koCount > 0 : enCount > 0)).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                style={filter === f.id
                  ? f.id === 'en' ? { backgroundColor: '#F0FDF4', color: '#16A34A' }
                  : f.id === 'ko' ? { backgroundColor: '#EFF6FF', color: '#3182F6' }
                  :                 { backgroundColor: '#191F28', color: '#fff' }
                  : { backgroundColor: '#F2F4F6', color: '#6B7684' }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((a, i) => <NewsCard key={i} article={a} onSave={onSave} />)}
      </div>
    </div>
  )
}

/* ── 공통 API 안내 배너 ───────────────────────────────────────────────────────── */
function ApiStatusBanner({ data }) {
  if (!data) return null
  const msgs = []
  if (!data.naver_available) msgs.push('Naver News API 키 미설정 (NAVER_CLIENT_ID/SECRET)')
  if (data.scope !== 'domestic' && data.news_en_count === 0)
    msgs.push('글로벌 뉴스 0건 — NEWS_API_KEY 설정 시 NewsAPI, 미설정 시 GDELT 자동 시도')
  if (!msgs.length) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 space-y-0.5">
      {msgs.map((m, i) => <p key={i}>⚠ {m}</p>)}
    </div>
  )
}

/* ── 기업 산업동향 결과 ───────────────────────────────────────────────────────── */
function CompanyTrendsResult({ data, onSave }) {
  if (!data) return null
  return (
    <div className="space-y-4">
      {/* 공통 시그널 배너 */}
      {data.common_signals?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-3">Common Signals</p>
          <ul className="space-y-1.5">
            {data.common_signals.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-800">
                <span className="text-blue-400 shrink-0">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="국내 산업 이슈" accent="#3182F6">
          <ListField items={data.domestic_issues} onSave={onSave ? () => onSave({ source_type: "AI 분석", sector: data.industry, key_content: data.domestic_issues?.map(i=>i.title||i).join("\n") }) : null} />
        </Card>
        <Card title="글로벌 산업 이슈" accent="#16A34A">
          <ListField items={data.global_issues} onSave={onSave ? () => onSave({ source_type: "AI 분석", sector: data.industry, key_content: data.global_issues?.map(i=>i.title||i).join("\n") }) : null} />
        </Card>
        <Card title="기업 영향" accent="#7C3AED">
          <StringField value={data.impact_on_corp} />
        </Card>
        <Card title="Deal Angle" accent="#D97706">
          <StringField value={data.deal_angle} />
        </Card>
        <Card title="재무적 영향" accent="#059669">
          <StringField value={data.financial_impact} />
        </Card>
        <Card title="리스크 요인" accent="#EA580C">
          <ListField items={data.risks} />
        </Card>
        <Card title="회계/공시 체크포인트" accent="#0891B2">
          <ListField items={data.accounting_checkpoints} />
        </Card>
        {data.dd_questions?.length > 0 && (
          <Card title="실사 질문 (DD)" accent="#6366F1">
            <ol className="space-y-1.5">
              {data.dd_questions.map((q, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                  <span className="text-indigo-400 font-bold shrink-0 w-5">{i+1}.</span>{q}
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <NewsSection news={data.news} koCount={data.news_ko_count} enCount={data.news_en_count} onSave={onSave} />
      {data.deal_highlights?.length > 0 && (
        <DealHighlightsSection
          dealHighlights={data.deal_highlights}
          totalNews={(data.news_ko_count || 0) + (data.news_en_count || 0)}
          sector={data.industry || ''}
        />
      )}
      <ApiStatusBanner data={data} />
    </div>
  )
}

/* ── 산업 분석 결과 ───────────────────────────────────────────────────────────── */
function IndustryAnalysisResult({ data, onSave }) {
  if (!data) return null
  return (
    <div className="space-y-4">
      {/* 섹터 개요 배너 */}
      {data.sector_overview && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-violet-500 uppercase tracking-wide mb-2">Sector Overview</p>
          <p className="text-sm text-gray-800 leading-relaxed">{data.sector_overview}</p>
        </div>
      )}

      {/* 공통 시그널 */}
      {data.common_signals?.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-3">국내외 공통 시그널</p>
          <ul className="space-y-1.5">
            {data.common_signals.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-800">
                <span className="text-blue-400 shrink-0">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="국내 산업 이슈" accent="#3182F6">
          <ListField items={data.domestic_issues} onSave={onSave ? () => onSave({ source_type: "AI 분석", sector: data.industry, key_content: data.domestic_issues?.map(i=>i.title||i).join("\n") }) : null} />
        </Card>
        <Card title="글로벌 산업 이슈" accent="#16A34A">
          <ListField items={data.global_issues} onSave={onSave ? () => onSave({ source_type: "AI 분析", key_content: data.global_issues?.map(i=>i.title||i).join("\n") }) : null} />
        </Card>
        <Card title="Deal Angle" accent="#D97706">
          <StringField value={data.deal_angle} />
        </Card>
        <Card title="딜 기회" accent="#7C3AED">
          <ListField items={data.deal_opportunities} />
        </Card>
        <Card title="밸류에이션 포인트" accent="#0891B2">
          <ListField items={data.valuation_points} />
        </Card>
        <Card title="회계/공시 체크포인트" accent="#6366F1">
          <ListField items={data.accounting_points} />
        </Card>
      </div>

      {data.dd_questions?.length > 0 && (
        <Card title="실사 질문 (DD)" accent="#6366F1">
          <ol className="space-y-1.5">
            {data.dd_questions.map((q, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                <span className="text-indigo-400 font-bold shrink-0 w-5">{i+1}.</span>{q}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <NewsSection news={data.sources} koCount={data.news_ko_count} enCount={data.news_en_count} onSave={onSave} />
      {data.deal_highlights?.length > 0 && (
        <DealHighlightsSection
          dealHighlights={data.deal_highlights}
          totalNews={(data.news_ko_count || 0) + (data.news_en_count || 0)}
          sector={data.industry || ''}
        />
      )}
      <ApiStatusBanner data={data} />
    </div>
  )
}

/* ── 메인 컴포넌트 ────────────────────────────────────────────────────────────── */
export default function IndustryIntelligencePanel() {
  const [mode, setMode]           = useState('company')
  const [corpName, setCorpName]   = useState('')
  const [industry, setIndustry]   = useState('')
  const [scope, setScope]         = useState('domestic')
  const [textInput, setTextInput] = useState('')
  const [showText, setShowText]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [companyData, setCompanyData] = useState(null)
  const [industryData, setIndustryData] = useState(null)
  const [insightOpen, setInsightOpen]   = useState(false)
  const [insightInit, setInsightInit]   = useState({})

  const openInsight = (prefill = {}) => {
    setInsightInit({
      sector:       industry || '',
      company_name: corpName || '',
      source_type:  'AI 분析',
      ...prefill,
    })
    setInsightOpen(true)
  }

  const canSubmit = mode === 'company' ? (corpName.trim() || industry.trim()) : industry.trim()
  const result    = mode === 'company' ? companyData : industryData

  const handleAnalyze = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    try {
      if (mode === 'company') {
        const res = await fetch(`${API}/api/company-industry-trends`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ corp_name: corpName.trim(), industry: industry.trim(), text_input: textInput.trim(), scope }),
        })
        if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)
        setCompanyData(await res.json())
      } else {
        const res = await fetch(`${API}/api/industry-analysis`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry: industry.trim(), text_input: textInput.trim(), scope }),
        })
        if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)
        setIndustryData(await res.json())
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">

          {/* 모드 토글 */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              {[{ id: 'company', label: '기업 산업동향' }, { id: 'industry', label: '산업 분석' }].map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); setError(null) }}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={mode === m.id
                    ? { backgroundColor: '#fff', color: '#191F28', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                    : { color: '#6B7684' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* 분석 범위 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">분석 범위</span>
              <div className="flex gap-1">
                {SCOPE_OPTIONS.map(s => (
                  <button key={s.id} onClick={() => setScope(s.id)} title={s.desc}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={scope === s.id
                      ? { backgroundColor: '#0D1B2A', color: '#fff' }
                      : { backgroundColor: '#F2F4F6', color: '#6B7684' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 입력 필드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === 'company' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">기업명</label>
                <input value={corpName} onChange={e => setCorpName(e.target.value)}
                  placeholder="예: 삼성전자, 카카오"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-gray-300 transition" />
              </div>
            )}
            <div className={mode === 'company' ? '' : 'md:col-span-2'}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">산업 / 섹터</label>
              <IndustryPicker value={industry} onChange={setIndustry} />
            </div>
          </div>

          {/* 범위 설명 */}
          {scope !== 'domestic' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-green-600">EN</span>
              {scope === 'global'
                ? '글로벌 포함: Naver 국내 뉴스 + NewsAPI/GDELT 영문 뉴스 동시 수집'
                : '글로벌 우선: NewsAPI/GDELT 영문 뉴스 중심으로 수집 (국내 뉴스 제외)'}
            </div>
          )}

          {/* 아티클 붙여넣기 */}
          <div className="mt-4">
            <button onClick={() => setShowText(!showText)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition">
              <svg className={`w-3.5 h-3.5 transition-transform ${showText ? 'rotate-90' : ''}`}
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showText ? '아티클 텍스트 숨기기' : '아티클 텍스트 직접 붙여넣기 (선택)'}
            </button>
            {showText && (
              <textarea value={textInput} onChange={e => setTextInput(e.target.value)} rows={6}
                placeholder="분석에 활용할 뉴스 기사, 리포트, IR 자료 등을 붙여넣으세요..."
                className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-300 resize-none transition font-mono" />
            )}
          </div>

          {/* 분석 버튼 */}
          <div className="mt-5 flex items-center gap-3">
            <button onClick={handleAnalyze} disabled={!canSubmit || loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold
                         transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0D1B2A', color: '#fff' }}>
              {loading ? <><Spinner /> 분석 중...</> : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.5 3.5 0 01-4.95 0l-.347-.347z" />
                  </svg>
                  {mode === 'company' ? '기업 산업동향 분석' : '산업 분석'}
                </>
              )}
            </button>
            {result && (
              <button onClick={() => { setCompanyData(null); setIndustryData(null) }}
                className="text-xs text-gray-400 hover:text-gray-600 transition">초기화</button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600">⚠ {error}</div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {mode === 'company' ? `${corpName || industry} 산업동향` : `${industry} 산업 분석`}
                </span>
                {result.news_en_count > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                    EN {result.news_en_count}건
                  </span>
                )}
                {result.news_ko_count > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    KO {result.news_ko_count}건
                  </span>
                )}
                {result.deal_highlights_count > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#FFF0F1', color: '#DC2626' }}>
                    💼 Deal {result.deal_highlights_count}건
                  </span>
                )}
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            {mode === 'company'
              ? <CompanyTrendsResult data={companyData} onSave={openInsight} />
              : <IndustryAnalysisResult data={industryData} onSave={openInsight} />
            }
          </div>
        )}
      </main>

      <InsightModal
        open={insightOpen}
        onClose={() => setInsightOpen(false)}
        onSaved={() => setInsightOpen(false)}
        initial={insightInit}
      />
    </div>
  )
}

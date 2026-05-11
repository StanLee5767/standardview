import { useState } from 'react'
import { CO_COLORS } from '../App.jsx'
import ComparisonTable from './ComparisonTable.jsx'
import FinancialTable from './FinancialTable.jsx'
import OpinionPanel from './OpinionPanel.jsx'
import DealIntelligencePanel from './DealIntelligencePanel.jsx'
import UnlistedFallback from './UnlistedFallback.jsx'

export default function ResultSection({
  corps, yearly, dartStatus, filename,
  opinions, loadingOp, claudeOk,
  onOpinion, onDownload,
}) {
  const [activeTab, setActiveTab] = useState('compare')
  const active = corps.map((c, i) => c ? i : null).filter(i => i !== null)

  // 연도 레이블: 데이터가 있는 연도를 수집
  const availableYears = [...new Set(
    yearly.flatMap(y => Object.keys(y || {})).filter(k => k !== '_fs' && /^\d{4}$/.test(k))
  )].sort().reverse()
  const yearLabel = availableYears.length > 0
    ? availableYears.slice(0, 3).join(' · ') + ' 결산 기준'
    : '연도 자동 탐색'

  const hasFinancials = (ci) => {
    const y = yearly[ci] || {}
    return Object.values(y).some(v => v && typeof v === 'object' && Object.keys(v).length > 0)
  }

  const tabs = [
    { key: 'compare', label: '전체 비교', color: '#191F28' },
    ...active.map(i => ({
      key: String(i),
      label: corps[i].corp_name,
      color: CO_COLORS[i],
      unlisted: !hasFinancials(i),
    })),
  ]

  const currentCi = activeTab === 'compare' ? null : Number(activeTab)

  return (
    <div className="space-y-5">
      {/* 결과 배너 */}
      <div className="bg-[#0D1B2A] rounded-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {active.map(i => (
            <div key={i} className="flex items-center gap-2 px-3 py-1 rounded-full"
                 style={{ backgroundColor: CO_COLORS[i] + '30' }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CO_COLORS[i] }} />
              <span className="text-white text-sm font-medium">{corps[i].corp_name}</span>
              {!hasFinancials(i) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">비공시</span>
              )}
            </div>
          ))}
          <span className="text-gray-400 text-xs ml-2">{yearLabel}</span>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20
                     rounded-xl text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <span>⬇</span> Excel
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={activeTab === t.key
              ? { backgroundColor: t.color, color: '#fff' }
              : { backgroundColor: '#fff', color: '#6B7684', border: '1px solid #E5E8EB' }}>
            {t.label}
            {t.unlisted && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">비공시</span>
            )}
          </button>
        ))}
      </div>

      {/* 테이블 / 비공시 fallback */}
      {activeTab === 'compare' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <ComparisonTable corps={corps} yearly={yearly} active={active} />
        </div>
      ) : hasFinancials(currentCi) ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <FinancialTable
            corpName={corps[currentCi]?.corp_name}
            yearly={yearly[currentCi]}
            color={CO_COLORS[currentCi]}
          />
        </div>
      ) : (
        <UnlistedFallback
          corpName={corps[currentCi]?.corp_name}
          dartStatus={dartStatus?.[currentCi]}
          color={CO_COLORS[currentCi]}
        />
      )}

      {/* DART 데이터가 있는 기업만 AI 의견 표시 */}
      {active.some(i => hasFinancials(i)) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-base">Claude AI 재무 의견</h3>
            {!claudeOk && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Claude CLI 미설치
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.filter(i => hasFinancials(i)).map(i => (
              <OpinionPanel
                key={i}
                idx={i}
                corpName={corps[i].corp_name}
                opinion={opinions[i]}
                loading={loadingOp[i]}
                claudeOk={claudeOk}
                onRequest={() => onOpinion(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Deal Intelligence (DART 데이터 있는 기업만) */}
      {active.some(i => hasFinancials(i)) && (
        <DealIntelligencePanel corps={corps} yearly={yearly} active={active.filter(i => hasFinancials(i))} />
      )}
    </div>
  )
}

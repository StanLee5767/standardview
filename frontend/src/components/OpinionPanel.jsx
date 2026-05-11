import { CO_COLORS } from '../App.jsx'
import { OPINION_KEYS, LV_COLOR, LV_BG, LV_ICON } from '../utils.js'

export default function OpinionPanel({ idx, corpName, opinion, loading, claudeOk, onRequest }) {
  const color = CO_COLORS[idx]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <div className="px-5 py-4 flex items-center justify-between"
           style={{ backgroundColor: color + '12' }}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <h4 className="font-bold text-gray-900 text-sm">{corpName}</h4>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5 ml-4">Claude AI 재무 분석 의견</p>
        </div>
        {!opinion && !loading && (
          <button
            onClick={onRequest}
            disabled={!claudeOk}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white
                       disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-80"
            style={{ backgroundColor: color }}
          >
            AI 분석
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <svg className="animate-spin h-7 w-7" style={{ color }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-gray-400">Claude AI 분석 중… (최대 2분)</p>
          </div>
        )}

        {!loading && !opinion && (
          <div className="py-6 text-center text-gray-300 text-sm">
            {claudeOk
              ? "'AI 분석' 버튼을 눌러 의견을 생성하세요"
              : 'Claude CLI가 설치되지 않아 분석할 수 없습니다'}
          </div>
        )}

        {!loading && opinion && (
          <div className="space-y-2">
            {OPINION_KEYS.map(([cat, lbl]) => {
              const item = opinion[lbl]
              if (!item) return null
              const lv   = item.level || 'note'
              const icon = LV_ICON[lv] || '·'
              return (
                <div key={lbl}
                     className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5"
                     style={{ backgroundColor: LV_BG[lv] || '#F9FAFB' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: LV_COLOR[lv] }}>
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-700">{lbl}</span>
                      <span className="text-xs font-semibold" style={{ color: LV_COLOR[lv] }}>
                        {item.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* 재생성 버튼 */}
            <button
              onClick={onRequest}
              className="w-full mt-2 py-2 rounded-xl text-xs font-medium text-gray-400
                         bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100"
            >
              ↻ 재생성
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

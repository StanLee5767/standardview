import SearchRow from './SearchRow.jsx'
import { CO_COLORS } from '../App.jsx'

export default function SearchSection({ corps, setCorps, onAnalyze, analyzing }) {
  const activeCount = corps.filter(Boolean).length

  const setCorpAt = (i, corp) =>
    setCorps(prev => { const n = [...prev]; n[i] = corp; return n })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-base">기업 선택</h2>
          <p className="text-xs text-gray-400 mt-0.5">최대 3개 기업을 동시에 비교할 수 있습니다</p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {activeCount}개 선택됨
            </span>
          )}
          <button
            onClick={onAnalyze}
            disabled={activeCount === 0 || analyzing}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: activeCount > 0 && !analyzing ? '#3182F6' : '#9CA3AF' }}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                분석 중…
              </span>
            ) : '분석 시작'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <SearchRow
            key={i}
            idx={i}
            color={CO_COLORS[i]}
            selected={corps[i]}
            onSelect={corp => setCorpAt(i, corp)}
            onClear={() => setCorpAt(i, null)}
          />
        ))}
      </div>

      {analyzing && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-[#3182F6] rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">DART 조회 중…</span>
        </div>
      )}
    </div>
  )
}

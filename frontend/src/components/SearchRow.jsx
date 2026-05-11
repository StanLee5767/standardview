import { useState, useRef, useEffect, useCallback } from 'react'
import { API } from '../App.jsx'

export default function SearchRow({ idx, color, selected, onSelect, onClear }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const wrapRef                 = useRef(null)
  const timerRef                = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setResults(data.results || [])
      setOpen(true)
    } catch {
      setResults([])
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e) => {
    const v = e.target.value
    setQuery(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 300)
  }

  const handlePick = (corp) => {
    onSelect(corp)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  const handleAddUnlisted = () => {
    if (!query.trim()) return
    onSelect({ corp_name: query.trim(), corp_code: '__unlisted__', stock_code: '', unlisted: true })
    setQuery('')
    setOpen(false)
    setResults([])
  }

  const labels = ['회사 1', '회사 2', '회사 3']

  return (
    <div className="flex items-center gap-3" ref={wrapRef}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
           style={{ backgroundColor: color }}>
        {idx + 1}
      </div>

      {selected ? (
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl border-2"
             style={{ borderColor: color, backgroundColor: color + '10' }}>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{selected.corp_name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {selected.unlisted
                ? '비상장/비공시 기업 — 수동 재무입력 모드'
                : `종목코드: ${selected.stock_code || '비상장'} · 기업코드: ${selected.corp_code}`}
            </p>
          </div>
          {selected.unlisted && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
              비공시
            </span>
          )}
          <button onClick={onClear}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
            ✕
          </button>
        </div>
      ) : (
        <div className="flex-1 relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={handleInput}
              onKeyDown={e => e.key === 'Enter' && doSearch(query)}
              placeholder={`${labels[idx]} 검색 (예: 삼성전자, 카카오)`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50
                         placeholder-gray-300"
              style={{ '--tw-ring-color': color + '60' }}
            />
            <button
              onClick={() => doSearch(query)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-white flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ backgroundColor: color }}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : '검색'}
            </button>
          </div>

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-30 max-h-72 overflow-y-auto">
              {results.length > 0 && (
                <div className="px-3 py-2 text-xs text-gray-400 border-b border-gray-50">
                  {results.length}개 기업 검색됨
                </div>
              )}
              {results.map((corp, i) => (
                <button key={i} onClick={() => handlePick(corp)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                  <p className="text-sm font-semibold text-gray-900">{corp.corp_name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    종목: {corp.stock_code || '비상장'} · 코드: {corp.corp_code}
                  </p>
                </button>
              ))}
              {/* 비상장 직접 추가 */}
              {query.trim() && (
                <button onClick={handleAddUnlisted}
                  className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-t border-gray-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">비공시</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">"{query}" 비상장/비공시 기업으로 추가</p>
                    <p className="text-[11px] text-gray-400">DART 데이터 없이 수동 재무입력 모드로 분석</p>
                  </div>
                </button>
              )}
              {results.length === 0 && !query.trim() && !loading && (
                <div className="px-4 py-4 text-sm text-gray-400 text-center">검색 결과가 없습니다</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

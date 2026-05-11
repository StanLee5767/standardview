import { useState, useEffect, useCallback } from 'react'
import { API } from '../App.jsx'
import InsightModal from './InsightModal.jsx'

const IMPACT_STYLE = {
  Low:    { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  High:   { bg: '#FFF0F1', text: '#DC2626', border: '#FECACA' },
}
const SOURCE_ICON = {
  '뉴스': '📰', 'DART': '📊', 'AI 분석': '🤖', 'Deal Memo': '💼', '직접 입력': '✏️',
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  )
}

function TagChip({ tag }) {
  return (
    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full
                     bg-gray-100 text-gray-500">
      #{tag.trim()}
    </span>
  )
}

function InsightCard({ item, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const impact = IMPACT_STYLE[item.impact_level] || IMPACT_STYLE.Medium
  const tags   = item.tags ? item.tags.split(',').filter(Boolean) : []

  const handleDelete = async () => {
    if (!window.confirm('이 인사이트를 삭제하시겠습니까?')) return
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200
                    hover:shadow-sm transition-all space-y-3">

      {/* 상단 행 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">{SOURCE_ICON[item.source_type] || '📌'}</span>
          <span className="text-xs font-semibold text-gray-500">{item.source_type}</span>
          <span className="text-gray-200">|</span>
          <span className="text-xs text-gray-400">{item.created_at}</span>
          {item.author && <span className="text-xs text-gray-400">{item.author}</span>}
        </div>
        <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: impact.bg, color: impact.text, borderColor: impact.border }}>
          {item.impact_level}
        </span>
      </div>

      {/* 기업 / 산업 */}
      {(item.company_name || item.sector) && (
        <div className="flex gap-2 flex-wrap">
          {item.company_name && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#3182F6]">
              {item.company_name}
            </span>
          )}
          {item.sector && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
              {item.sector}
            </span>
          )}
        </div>
      )}

      {/* 출처 제목 */}
      {item.source_title && (
        <p className="text-xs text-gray-400 font-medium truncate">
          {item.source_url
            ? <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                 className="hover:text-blue-500 transition-colors">🔗 {item.source_title}</a>
            : item.source_title}
        </p>
      )}

      {/* 주요 내용 */}
      <div>
        <p className={`text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap
                       ${!expanded ? 'line-clamp-3' : ''}`}>
          {item.key_content}
        </p>
        {item.key_content?.length > 120 && (
          <button onClick={() => setExpanded(e => !e)}
            className="text-[10px] text-blue-500 hover:text-blue-700 mt-0.5 font-medium">
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>

      {/* 내 인사이트 */}
      {item.user_insight && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1">내 인사이트</p>
          <p className="text-xs text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
            {item.user_insight}
          </p>
        </div>
      )}

      {/* 후속 확인사항 */}
      {item.next_actions && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">후속 확인사항</p>
          <p className="text-xs text-gray-700 leading-relaxed">{item.next_actions}</p>
        </div>
      )}

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {tags.map((t, i) => <TagChip key={i} tag={t} />)}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-2 pt-1 border-t border-gray-50">
        <button onClick={() => onEdit(item)}
          className="flex items-center gap-1 text-xs font-medium text-gray-400
                     hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          수정
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1 text-xs font-medium text-gray-400
                     hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50
                     disabled:opacity-40">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {deleting ? '삭제 중…' : '삭제'}
        </button>
      </div>
    </div>
  )
}

function FilterBar({ filters, setFilters, onReset }) {
  const INPUT = `px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700
    focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
    placeholder-gray-300 bg-white transition`
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
      {[
        { key: 'company', placeholder: '기업명', label: '기업' },
        { key: 'sector',  placeholder: '산업',   label: '산업' },
        { key: 'tag',     placeholder: '태그',   label: '태그' },
      ].map(({ key, placeholder, label }) => (
        <div key={key}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
          <input value={filters[key] || ''} placeholder={placeholder}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            className={`${INPUT} w-28`} />
        </div>
      ))}

      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">임팩트</p>
        <select value={filters.impact || ''} onChange={e => setFilters(f => ({ ...f, impact: e.target.value }))}
          className={`${INPUT} w-28`}>
          <option value="">전체</option>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">시작일</p>
        <input type="date" value={filters.date_from || ''}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
          className={`${INPUT} w-36`} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">종료일</p>
        <input type="date" value={filters.date_to || ''}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
          className={`${INPUT} w-36`} />
      </div>

      <button onClick={onReset}
        className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-400
                   hover:text-gray-600 hover:bg-gray-100 transition">
        초기화
      </button>
    </div>
  )
}

function exportMarkdown(items) {
  const lines = ['# 인사이트 로그', '']
  items.forEach(it => {
    const tags = it.tags ? it.tags.split(',').map(t => `#${t.trim()}`).join(' ') : ''
    lines.push(`## [${it.impact_level}] ${it.source_title || it.company_name || '(제목 없음)'}`)
    lines.push(`- **날짜**: ${it.created_at}  **기록자**: ${it.author}`)
    lines.push(`- **기업**: ${it.company_name || '-'}  **산업**: ${it.sector || '-'}`)
    lines.push(`- **출처 유형**: ${it.source_type}`)
    if (it.source_url) lines.push(`- **URL**: ${it.source_url}`)
    lines.push(`\n**주요 내용**\n${it.key_content}`)
    if (it.user_insight) lines.push(`\n**내 인사이트**\n${it.user_insight}`)
    if (it.next_actions)  lines.push(`\n**후속 확인사항**\n${it.next_actions}`)
    if (tags) lines.push(`\n${tags}`)
    lines.push('\n---\n')
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `insight_log_${new Date().toISOString().slice(0,10)}.md`
  a.click(); URL.revokeObjectURL(a.href)
}

function exportCSV(items) {
  const headers = ['ID','날짜','기록자','기업','산업','출처유형','출처제목','URL','주요내용','인사이트','임팩트','후속확인','태그']
  const rows = items.map(it => [
    it.id, it.created_at, it.author, it.company_name, it.sector,
    it.source_type, it.source_title, it.source_url,
    it.key_content, it.user_insight, it.impact_level, it.next_actions, it.tags
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `insight_log_${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(a.href)
}

function exportJSON(items) {
  const json = JSON.stringify(items, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `insight_log_${new Date().toISOString().slice(0,10)}.json`
  a.click(); URL.revokeObjectURL(a.href)
}

export default function InsightLogPanel() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [backupMsg, setBackupMsg]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`${API}/api/insights?${params}`)
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleNew   = ()     => { setEditTarget(null); setModalOpen(true) }
  const handleEdit  = (item) => { setEditTarget(item); setModalOpen(true) }
  const handleSaved = ()     => load()
  const handleDelete = async (id) => {
    await fetch(`${API}/api/insights/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(it => it.id !== id))
  }

  const handleBackup = async () => {
    setBackupMsg({ type: 'loading', text: 'DB 백업 중...' })
    try {
      const res = await fetch(`${API}/api/backup/db`, { method: 'POST' })
      const d = await res.json()
      if (d.ok) setBackupMsg({ type: 'ok', text: `백업 완료: ${d.filename} (${d.size_kb}KB)` })
      else setBackupMsg({ type: 'err', text: '백업 실패' })
    } catch { setBackupMsg({ type: 'err', text: '서버 연결 오류' }) }
    setTimeout(() => setBackupMsg(null), 5000)
  }

  const handleExport = (fmt) => {
    window.location.href = `${API}/api/backup/export?format=${fmt}`
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* 툴바 */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800">인사이트 로그</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '로딩 중…' : `${items.length}개의 인사이트`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* 백업 버튼 */}
            <button onClick={handleBackup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                         bg-[#0D1B2A] text-white hover:bg-[#1E3A5F] transition">
              💾 DB 백업
            </button>
            {/* 내보내기 버튼 */}
            <button onClick={() => handleExport('md')} disabled={!items.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                         bg-gray-800 text-white hover:bg-gray-700 transition disabled:opacity-40">
              ⬇ MD
            </button>
            <button onClick={() => handleExport('csv')} disabled={!items.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                         bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-40">
              ⬇ CSV
            </button>
            <button onClick={() => handleExport('json')} disabled={!items.length}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                         bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-40">
              ⬇ JSON
            </button>
            <button onClick={handleNew}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold
                         text-white transition-all"
              style={{ backgroundColor: '#0D1B2A' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              새 인사이트
            </button>
          </div>
        </div>

        {/* 백업 상태 메시지 */}
        {backupMsg && (
          <div className={
            'px-4 py-2 rounded-xl text-xs font-medium ' + (
              backupMsg.type === 'ok'  ? 'bg-green-50 text-green-700 border border-green-200'
            : backupMsg.type === 'err' ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-blue-50 text-blue-600 border border-blue-200'
            )
          }>
            {backupMsg.text}
          </div>
        )}

        {/* 필터 */}
        <FilterBar filters={filters} setFilters={setFilters}
          onReset={() => setFilters({})} />

        {/* 카드 목록 */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-20 flex flex-col
                          items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-xl">
              📋
            </div>
            <p className="text-sm font-semibold text-gray-500">아직 저장된 인사이트가 없습니다</p>
            <p className="text-xs text-gray-400">
              산업 분석, Deal Signal, 뉴스 기사 등에서 "인사이트로 저장" 버튼을 눌러보세요.
            </p>
            <button onClick={handleNew}
              className="mt-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#0D1B2A' }}>
              + 직접 입력
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map(it => (
              <InsightCard key={it.id} item={it}
                onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <InsightModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        initial={editTarget || {}}
      />
    </div>
  )
}

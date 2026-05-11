import { useState, useEffect } from 'react'
import { API } from '../App.jsx'

const TODAY = new Date().toISOString().slice(0, 10)

const SOURCE_TYPES = ['뉴스', 'DART', 'AI 분석', 'Deal Memo', 'Macro News', '직접 입력']
const IMPACT_LEVELS = ['Low', 'Medium', 'High']

const IMPACT_STYLE = {
  Low:    { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  Medium: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  High:   { bg: '#FFF0F1', text: '#DC2626', border: '#FECACA' },
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLS = `w-full px-3 py-2 rounded-xl border border-gray-200 text-sm
  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
  placeholder-gray-300 transition bg-white`

export default function InsightModal({ open, onClose, onSaved, initial = {} }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (open) {
      setForm({
        created_at:   TODAY,
        author:       '이기준',
        company_name: '',
        sector:       '',
        source_type:  '직접 입력',
        source_title: '',
        source_url:   '',
        key_content:  '',
        user_insight: '',
        impact_level: 'Medium',
        next_actions: '',
        tags:         '',
        ...initial,
      })
      setError(null)
    }
  }, [open])

  if (!open) return null

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    if (!form.key_content?.trim()) { setError('주요 내용을 입력하세요.'); return }
    setSaving(true); setError(null)
    try {
      const isEdit = !!form.id
      const url    = isEdit ? `${API}/api/insights/${form.id}` : `${API}/api/insights`
      const res    = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const saved = await res.json()
      onSaved?.(saved)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const impactStyle = IMPACT_STYLE[form.impact_level] || IMPACT_STYLE.Medium

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-16">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh]
                      flex flex-col overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-800 text-base">
              {form.id ? '인사이트 수정' : '인사이트로 저장'}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 body - 스크롤 */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* 행1: 기록일자 / 기록자 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="기록일자">
              <input type="date" value={form.created_at || ''} onChange={set('created_at')}
                className={INPUT_CLS} />
            </Field>
            <Field label="기록자">
              <input value={form.author || ''} onChange={set('author')}
                placeholder="이기준" className={INPUT_CLS} />
            </Field>
          </div>

          {/* 행2: 관련 기업 / 관련 산업 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="관련 기업">
              <input value={form.company_name || ''} onChange={set('company_name')}
                placeholder="삼성전자, 카카오..." className={INPUT_CLS} />
            </Field>
            <Field label="관련 산업">
              <input value={form.sector || ''} onChange={set('sector')}
                placeholder="반도체, AI..." className={INPUT_CLS} />
            </Field>
          </div>

          {/* 출처 유형 */}
          <Field label="출처 유형">
            <div className="flex gap-1.5 flex-wrap">
              {SOURCE_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, source_type: t }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                  style={form.source_type === t
                    ? { backgroundColor: '#0D1B2A', color: '#fff', borderColor: '#0D1B2A' }
                    : { backgroundColor: '#F9FAFB', color: '#6B7684', borderColor: '#E5E7EB' }}>
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* 행3: 출처 제목 / URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="출처 제목">
              <input value={form.source_title || ''} onChange={set('source_title')}
                placeholder="기사 제목 또는 문서명" className={INPUT_CLS} />
            </Field>
            <Field label="출처 URL">
              <input value={form.source_url || ''} onChange={set('source_url')}
                placeholder="https://..." className={INPUT_CLS} />
            </Field>
          </div>

          {/* 주요 내용 */}
          <Field label="주요 내용" required>
            <textarea value={form.key_content || ''} onChange={set('key_content')} rows={3}
              placeholder="핵심 내용을 요약하세요..."
              className={`${INPUT_CLS} resize-none`} />
          </Field>

          {/* 내 인사이트 */}
          <Field label="내 인사이트">
            <textarea value={form.user_insight || ''} onChange={set('user_insight')} rows={3}
              placeholder="이 정보에서 도출한 나의 관점이나 해석을 작성하세요..."
              className={`${INPUT_CLS} resize-none`} />
          </Field>

          {/* 임팩트 수준 */}
          <Field label="임팩트 수준">
            <div className="flex gap-2">
              {IMPACT_LEVELS.map(lv => {
                const s = IMPACT_STYLE[lv]
                return (
                  <button key={lv} onClick={() => setForm(f => ({ ...f, impact_level: lv }))}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all border-2"
                    style={form.impact_level === lv
                      ? { backgroundColor: s.bg, color: s.text, borderColor: s.border }
                      : { backgroundColor: '#F9FAFB', color: '#9CA3AF', borderColor: '#F3F4F6' }}>
                    {lv}
                  </button>
                )
              })}
            </div>
          </Field>

          {/* 후속 확인사항 */}
          <Field label="후속 확인사항">
            <textarea value={form.next_actions || ''} onChange={set('next_actions')} rows={2}
              placeholder="추가로 확인해야 할 내용, 후속 액션 등을 적어주세요..."
              className={`${INPUT_CLS} resize-none`} />
          </Field>

          {/* 태그 */}
          <Field label="태그">
            <input value={form.tags || ''} onChange={set('tags')}
              placeholder="쉼표로 구분: AI, M&A, 반도체, 밸류에이션"
              className={INPUT_CLS} />
          </Field>

          {error && (
            <p className="text-xs text-red-500 font-medium">⚠ {error}</p>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0 bg-gray-50/60">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500
                       hover:text-gray-700 hover:bg-gray-100 transition">
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#0D1B2A' }}>
            {saving ? '저장 중…' : (form.id ? '수정 저장' : '인사이트 저장')}
          </button>
        </div>
      </div>
    </div>
  )
}

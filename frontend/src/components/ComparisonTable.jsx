import { CO_COLORS } from '../App.jsx'
import { SECTIONS, YEARS, fmtVal } from '../utils.js'

export default function ComparisonTable({ corps, yearly, active }) {
  if (active.length === 0) return null

  return (
    <div>
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-900">
        <h3 className="font-bold text-white text-base">3사 재무 비교</h3>
        <p className="text-xs text-gray-400 mt-0.5">2023 · 2024 · 2025 결산 기준</p>
      </div>

      <div className="overflow-x-auto">
        <table className="text-sm" style={{ minWidth: `${200 + active.length * 3 * 110}px` }}>
          <thead>
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 bg-gray-50 sticky left-0 z-10 w-36">
                항목
              </th>
              {active.map(i => (
                YEARS.map(yr => (
                  <th key={`${i}-${yr}`}
                      className="px-3 py-2 text-center text-xs font-semibold w-28"
                      style={{ backgroundColor: CO_COLORS[i] + '15', color: CO_COLORS[i] }}>
                    <span className="block text-[10px] font-bold">{corps[i].corp_name}</span>
                    <span className="font-normal text-gray-500">{yr}</span>
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map(({ title, keys, isRatio }) => (
              <>
                <tr key={`sec-${title}`}>
                  <td colSpan={1 + active.length * 3}
                      className="px-5 py-2 text-xs font-bold text-white bg-gray-700 sticky left-0">
                    {title}
                  </td>
                </tr>
                {keys.map((key, ki) => {
                  const bg = ki % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                  return (
                    <tr key={key} style={{ backgroundColor: bg }}>
                      <td className="px-5 py-2.5 text-gray-600 font-medium sticky left-0 z-10"
                          style={{ backgroundColor: bg }}>
                        {key}
                      </td>
                      {active.map(i =>
                        YEARS.map(yr => {
                          const v = yearly[i]?.[yr]?.[key] ?? null
                          return (
                            <td key={`${i}-${yr}`}
                                className="px-3 py-2.5 text-center font-semibold text-gray-800">
                              {fmtVal(v, key, isRatio)}
                            </td>
                          )
                        })
                      )}
                    </tr>
                  )
                })}
                <tr key={`gap-${title}`}><td colSpan={1 + active.length * 3} className="h-2" /></tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

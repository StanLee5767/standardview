import { SECTIONS, YEARS, fmtVal, yoy } from '../utils.js'

export default function FinancialTable({ corpName, yearly, color }) {
  if (!yearly || Object.keys(yearly).length === 0) {
    return (
      <div className="p-10 text-center text-gray-400 text-sm">데이터 없음</div>
    )
  }

  const fs = yearly[YEARS.find(y => yearly[y])]?._fs || ''

  return (
    <div>
      {/* 시트 헤더 */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100"
           style={{ backgroundColor: color + '10' }}>
        <div>
          <h3 className="font-bold text-gray-900 text-base">{corpName}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{fs === 'CFS' ? '연결재무제표' : '별도재무제표'}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 w-36 sticky left-0 bg-gray-50">항목</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center">2023</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center">2024</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-400 text-center">YoY</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 text-center">2025</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-400 text-center">YoY</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map(({ title, keys, isRatio }) => (
              <>
                <tr key={`sec-${title}`}>
                  <td colSpan={6} className="px-5 py-2 text-xs font-bold text-white"
                      style={{ backgroundColor: color }}>
                    {title}
                  </td>
                </tr>
                {keys.map((key, ki) => {
                  const vals = YEARS.map(yr => yearly[yr]?.[key] ?? null)
                  const y24 = yoy(vals[1], vals[0])
                  const y25 = yoy(vals[2], vals[1])
                  const bg  = ki % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                  return (
                    <tr key={key} style={{ backgroundColor: bg }}>
                      <td className="px-5 py-2.5 text-gray-600 font-medium sticky left-0"
                          style={{ backgroundColor: bg }}>{key}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-800">
                        {fmtVal(vals[0], key, isRatio)}
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-800">
                        {fmtVal(vals[1], key, isRatio)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-medium"
                          style={{ color: y24.color }}>
                        {y24.text}
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-gray-800">
                        {fmtVal(vals[2], key, isRatio)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs font-medium"
                          style={{ color: y25.color }}>
                        {y25.text}
                      </td>
                    </tr>
                  )
                })}
                <tr key={`gap-${title}`}><td colSpan={6} className="h-2" /></tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

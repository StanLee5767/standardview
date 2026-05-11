function inlineMd(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    return part || null
  })
}

export default function SimpleMarkdown({ content }) {
  const lines   = (content || '').split('\n')
  const blocks  = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table block
    if (line.trim().startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!lines[i].match(/^\|[-:\s|]+\|/)) rows.push(lines[i])
        i++
      }
      blocks.push({ type: 'table', rows })
      continue
    }

    // List block
    if (line.match(/^[-*] /) || line.match(/^\d+\. /)) {
      const items = []
      const ordered = !!line.match(/^\d+\. /)
      while (i < lines.length && (lines[i].match(/^[-*] /) || lines[i].match(/^\d+\. /))) {
        items.push(lines[i].replace(/^[-*] |^\d+\. /, ''))
        i++
      }
      blocks.push({ type: 'list', items, ordered })
      continue
    }

    if (line.startsWith('# '))   { blocks.push({ type: 'h1', text: line.slice(2) });  i++; continue }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', text: line.slice(3) });  i++; continue }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) });  i++; continue }
    if (line.match(/^> /))       { blocks.push({ type: 'blockquote', text: line.slice(2) }); i++; continue }
    if (line.match(/^---+$/))    { blocks.push({ type: 'hr' });  i++; continue }
    if (!line.trim())            { blocks.push({ type: 'br' }); i++; continue }
    blocks.push({ type: 'p', text: line }); i++
  }

  return (
    <div className="space-y-0.5">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case 'h1': return (
            <h1 key={idx} className="text-xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
              {inlineMd(b.text)}
            </h1>
          )
          case 'h2': return (
            <h2 key={idx} className="text-[15px] font-bold text-gray-800 mt-6 mb-2 pb-1.5 border-b border-gray-200">
              {inlineMd(b.text)}
            </h2>
          )
          case 'h3': return (
            <h3 key={idx} className="text-sm font-semibold text-gray-700 mt-4 mb-1">
              {inlineMd(b.text)}
            </h3>
          )
          case 'hr': return <hr key={idx} className="border-gray-200 my-4" />
          case 'br': return <div key={idx} className="h-1.5" />
          case 'blockquote': return (
            <div key={idx} className="border-l-4 border-amber-300 bg-amber-50 px-4 py-2 my-3 rounded-r-lg text-sm text-amber-800">
              {inlineMd(b.text)}
            </div>
          )
          case 'p': return (
            <p key={idx} className="text-sm text-gray-700 leading-relaxed">
              {inlineMd(b.text)}
            </p>
          )
          case 'list': return (
            <ul key={idx} className="space-y-0.5 my-1.5 ml-1">
              {b.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-400 flex-shrink-0 mt-0.5 select-none">
                    {b.ordered ? `${j + 1}.` : '·'}
                  </span>
                  <span>{inlineMd(item)}</span>
                </li>
              ))}
            </ul>
          )
          case 'table': return (
            <div key={idx} className="overflow-x-auto my-3">
              <table className="text-sm w-full border-collapse">
                <tbody>
                  {b.rows.map((row, ri) => {
                    const cells = row.split('|').filter(Boolean).map(c => c.trim())
                    return (
                      <tr key={ri} className={ri % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        {cells.map((cell, ci) =>
                          ri === 0
                            ? <th key={ci} className="border border-gray-200 px-3 py-1.5 text-left font-semibold text-gray-700 text-xs bg-gray-100">{cell}</th>
                            : <td key={ci} className="border border-gray-200 px-3 py-1.5 text-gray-700">{inlineMd(cell)}</td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
          default: return null
        }
      })}
    </div>
  )
}

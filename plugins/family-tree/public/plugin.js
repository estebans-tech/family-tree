// Opens the UI panel
// penpot.ui.open('Family Tree — Plugin PoC', '/index.html')

// Receive messages from the UI
// penpot.ui.onMessage(async msg => {
//   if (!msg || msg.type !== 'DRAW' || !msg.payload || !msg.payload.ok) return
//   await draw(msg.payload)
// })

penpot.ui.open('Family Tree — Plugin', '/index.html')

penpot.ui.onMessage(async msg => {
  const m = msg && msg.pluginMessage ? msg.pluginMessage : msg
  if (!m || m.type !== 'DRAW' || !m.payload || !m.payload.ok) return
  await draw(m.payload)
})

function getPage() {
  try {
    if (penpot.document && typeof penpot.document.getCurrentPage === 'function')
      return penpot.document.getCurrentPage()
    if (typeof penpot.getCurrentPage === 'function')
      return penpot.getCurrentPage()
  } catch {}
  return null
}

async function draw(data) {
  const page = getPage()
  if (!page) {
    try { penpot.notify?.('No current page available from plugin API') } catch {}
    return
  }

  const nodeW = 140
  const nodeH = 60
  const margin = 40

  // remove previous render
  for (const n of page.children || []) {
    if (n.name === 'Family Tree') page.removeChild(n)
  }

  const group = page.createGroup ? page.createGroup({ name: 'Family Tree' }) : page
  const byId = new Map()

  // nodes
  for (const n of data.nodes) {
    const frame = page.createFrame({
      name: n.id,
      x: n.x + margin,
      y: n.y + margin,
      width: nodeW,
      height: nodeH,
      cornerRadius: 10,
      fills: [{ type: 'SOLID', color: { r: 0.947, g: 0.973, b: 0.988, a: 1 } }],
      strokes: [{ type: 'SOLID', color: { r: 0.2, g: 0.27, b: 0.34, a: 1 }, width: 1 }]
    })

    frame.setPluginData?.('nodeId', n.id)

    const label = page.createText({
      text: n.year ? `${n.name} (${n.year})` : n.name,
      fontSize: 14,
      fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.09, b: 0.16, a: 1 } }],
      x: 0, y: 0, width: nodeW, height: nodeH,
      textAlignHorizontal: 'CENTER',
      textAlignVertical: 'CENTER'
    })

    frame.appendChild(label)
    group.appendChild?.(frame) // if group is same as page, this is a no-op
    byId.set(n.id, frame)
  }

  // edges
  const stroke = { type: 'SOLID', color: { r: 0.58, g: 0.64, b: 0.69, a: 1 }, width: 2 }
  for (const e of data.edges) {
    const from = byId.get(e.from)
    const to = byId.get(e.to)
    if (!from || !to) continue
    const ax = from.x + from.width / 2
    const ay = from.y + from.height / 2
    const bx = to.x + to.width / 2
    const by = to.y + to.height / 2

    page.createLine({
      name: `${e.from}->${e.to}`,
      x1: ax, y1: ay, x2: bx, y2: by,
      strokes: [stroke]
    })
  }

  try { penpot.document?.setSelection?.([group]) } catch {}
}
  
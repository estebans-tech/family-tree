// Family Tree — worker
// Draw nodes/edges inside a dedicated board named "Family Tree".
// On every run we remove any previous "Family Tree" board, then recreate it.
// We skip text for now (your build rejects createText payloads).

penpot.ui.open('Family Tree — Plugin PoC', '/index.html')

// ---------------- messaging ----------------
penpot.ui.onMessage(async msg => {
  const m = msg && msg.pluginMessage ? msg.pluginMessage : msg
  if (!m || m.type !== 'DRAW' || !m.payload || !m.payload.ok) return
  await draw(m.payload)
})

// ---------------- helpers -----------------
function getPage() {
  try {
    if (penpot.currentPage) return penpot.currentPage
    if (penpot.document && typeof penpot.document.getCurrentPage === 'function')
      return penpot.document.getCurrentPage()
    if (typeof penpot.getCurrentPage === 'function')
      return penpot.getCurrentPage()
  } catch {}
  return null
}

async function getChildren(node) {
  try {
    if (Array.isArray(node.children)) return node.children
    if (typeof node.getChildren === 'function') return await node.getChildren()
  } catch {}
  return []
}

async function removeChild(parent, child) {
  try {
    if (typeof parent.removeChild === 'function') return parent.removeChild(child)
  } catch {}
  try {
    if (typeof penpot.removeShape === 'function') return penpot.removeShape(child)
  } catch {}
}

async function findBoardsNamed(parent, name) {
  const out = []
  const kids = await getChildren(parent)
  for (const k of kids) {
    const kname = k?.name || ''
    // best-effort heuristic: board-like nodes may expose "type" or "isBoard"
    if (kname === name) out.push(k)
  }
  return out
}

function bboxFromNodes(nodes, nodeW, nodeH, margin) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    const x1 = n.x + margin
    const y1 = n.y + margin
    const x2 = x1 + nodeW
    const y2 = y1 + nodeH
    if (x1 < minX) minX = x1
    if (y1 < minY) minY = y1
    if (x2 > maxX) maxX = x2
    if (y2 > maxY) maxY = y2
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 1; maxY = 1 }
  return {
    x: minX - margin,
    y: minY - margin,
    width: (maxX - minX) + margin * 2,
    height: (maxY - minY) + margin * 2
  }
}

// ---------------- draw --------------------
async function draw(data) {
  const page = getPage()
  if (!page) {
    console.warn('[family-tree] draw aborted: no currentPage')
    return
  }

  const NODE_W = 140
  const NODE_H = 60
  const MARGIN = 40

  // 1) Remove any previous Family Tree board
  const oldBoards = await findBoardsNamed(page, 'Family Tree')
  for (const b of oldBoards) await removeChild(page, b)

  // 2) Create a container board (if API available). Fallback to page as parent.
  const box = bboxFromNodes(data.nodes, NODE_W, NODE_H, MARGIN)
  let parentForShapes = page
  try {
    // New API (Penpot 1.0+) uses createBoard with { parent, x, y, width, height }
    const board = await penpot.createBoard({
      parent: page,
      name: 'Family Tree',
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    })
    parentForShapes = board || page
  } catch {
    // Board not supported in this build — draw on page directly
    parentForShapes = page
  }

  // 3) Draw nodes as rectangles inside the board (or page)
  const byId = new Map()
  for (const n of data.nodes) {
    const rect = await penpot.createRectangle({
      parent: parentForShapes,
      name: 'ft:' + (n.year ? `${n.name} (${n.year})` : n.name),
      x: (parentForShapes === page ? n.x + MARGIN : n.x + MARGIN - box.x),
      y: (parentForShapes === page ? n.y + MARGIN : n.y + MARGIN - box.y),
      width: NODE_W,
      height: NODE_H,
      cornerRadius: 10,
      fills: [{ type: 'SOLID', color: { r: 0.947, g: 0.973, b: 0.988, a: 1 } }],
      strokes: [{ type: 'SOLID', color: { r: 0.2, g: 0.27, b: 0.34, a: 1 }, width: 1 }]
    })
    byId.set(n.id, rect)
  }

  // 4) Draw edges as paths (coordinates adjusted if parent is board)
  const stroke = { type: 'SOLID', color: { r: 0.58, g: 0.64, b: 0.69, a: 1 }, width: 2 }

  for (const e of data.edges) {
    const a = byId.get(e.from)
    const b = byId.get(e.to)
    if (!a || !b) continue

    const ax = a.x + a.width / 2
    const ay = a.y + a.height / 2
    const bx = b.x + b.width / 2
    const by = b.y + b.height / 2

    await penpot.createPath({
      parent: parentForShapes,
      name: `ft:${e.from}->${e.to}`,
      d: `M ${ax} ${ay} L ${bx} ${by}`,
      strokes: [stroke]
    })
  }

  // 5) Zoom to result if available
  try {
    const shapes = await getChildren(parentForShapes)
    if (shapes.length && penpot.viewport?.zoomToShapes) penpot.viewport.zoomToShapes(shapes)
  } catch {}
}

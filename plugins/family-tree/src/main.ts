/// <reference types="@penpot/plugin-types" />

// Minimal UI + draw routine. We first draw nodes + labels, edges in next step.

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T

const btn = $('#btn') as HTMLButtonElement
const promptEl = $('#prompt') as HTMLTextAreaElement
const apiEl = $('#api') as HTMLInputElement
const out = $('#out') as HTMLPreElement

type LayoutPayload = {
  ok: boolean
  nodes: { id: string, name: string, year?: number, x: number, y: number }[]
  edges: { from: string, to: string }[]
}

btn.addEventListener('click', async () => {
  const q = promptEl.value.trim()
  const base = apiEl.value.trim()
  if (!q || !base) {
    out.textContent = 'Missing prompt or API base'
    return
  }

  try {
    const url = `${base}?q=${encodeURIComponent(q)}`
    const res = await fetch(url, { method: 'GET' })
    const data = (await res.json()) as LayoutPayload
    out.textContent = JSON.stringify(data, null, 2)

    if (!data.ok) return
    await drawNodes(data)
  } catch (e) {
    out.textContent = `Fetch error: ${String(e)}`
  }
})

async function drawNodes(data: LayoutPayload) {
  // Tune these to match your Svelte layout sizes
  const nodeW = 140
  const nodeH = 60
  const margin = 40

  // Safety: make sure we have a page to draw on
  const page = penpot.document.getCurrentPage()
  if (!page) {
    out.textContent += '\nNo active page to draw on'
    return
  }

  // Create a top-level group so everything stays together
  const group = page.createGroup({ name: 'Family Tree' })

  for (const n of data.nodes) {
    // parent frame (card)
    const frame = page.createFrame({
      name: n.name,
      x: n.x + margin,
      y: n.y + margin,
      width: nodeW,
      height: nodeH,
      cornerRadius: 10,
      fills: [{ type: 'SOLID', color: { r: 0.947, g: 0.973, b: 0.988, a: 1 } }],
      strokes: [{ type: 'SOLID', color: { r: 0.2, g: 0.27, b: 0.34, a: 1 }, width: 1 }]
    })

    // text label centered inside
    const label = page.createText({
      text: n.year ? `${n.name} (${n.year})` : n.name,
      fontSize: 14,
      fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.09, b: 0.16, a: 1 } }],
      x: 0,
      y: 0,
      width: nodeW,
      height: nodeH,
      textAlignHorizontal: 'CENTER',
      textAlignVertical: 'CENTER'
    })

    // nest label inside frame so it moves together
    frame.appendChild(label)

    // add frame under the top-level group
    group.appendChild(frame)
  }

  // Optional: focus selection on the new group
  penpot.document.setSelection([group])
}

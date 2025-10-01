/// <reference types="@penpot/plugin-types" />

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

const inPenpot = typeof window !== 'undefined' && typeof (window as any).penpot !== 'undefined'

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
    out.textContent = JSON.stringify({ inPenpot, ...data }, null, 2)

    if (!data.ok) return
    if (!inPenpot) {
      out.textContent += '\n\nNote: open this plugin inside Penpot to draw on the canvas.'
      return
    }

    await drawNodes(data)   // these functions use the penpot API
    // await drawEdges(data) // enable in the next step
  } catch (e) {
    out.textContent = `Fetch error: ${String(e)}`
  }
})

async function drawNodes(data: LayoutPayload) {
  // penpot runtime is guaranteed by the guard above
  // @ts-ignore
  const page = penpot.document.getCurrentPage()
  if (!page) {
    out.textContent += '\nNo active page to draw on'
    return
  }

  const nodeW = 140
  const nodeH = 60
  const margin = 40

  // @ts-ignore
  const group = page.createGroup({ name: 'Family Tree' })

  for (const n of data.nodes) {
    // @ts-ignore
    const frame = page.createFrame({
      name: n.id, // use id, not display name — easier to connect edges later
      x: n.x + margin,
      y: n.y + margin,
      width: nodeW,
      height: nodeH,
      cornerRadius: 10,
      fills: [{ type: 'SOLID', color: { r: 0.947, g: 0.973, b: 0.988, a: 1 } }],
      strokes: [{ type: 'SOLID', color: { r: 0.2, g: 0.27, b: 0.34, a: 1 }, width: 1 }]
    })

    // @ts-ignore
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

    frame.appendChild(label)
    group.appendChild(frame)
  }

  // @ts-ignore
  penpot.document.setSelection([group])
}
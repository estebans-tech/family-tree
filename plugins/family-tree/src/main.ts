/// <reference types="@penpot/plugin-types" />

// Minimal UI logic: fetch layout JSON, show it in the debug box,
// and notify the worker to draw on the Penpot canvas.

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

    // show payload for debugging in the plugin panel
    out.textContent = JSON.stringify({ inPenpot: false, ...data }, null, 2)

    // send to worker (Penpot expects pluginMessage; we also send bare for compatibility)
    window.parent?.postMessage({ pluginMessage: { type: 'DRAW', payload: data } }, '*')
    window.parent?.postMessage({ type: 'DRAW', payload: data }, '*')
    console.log('sent DRAW to worker', data)
  } catch (e) {
    out.textContent = `Fetch error: ${String(e)}`
  }
})
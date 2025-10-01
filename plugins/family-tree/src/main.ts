// Minimal plugin shell: fetch layout JSON, show it, prep for draw in next step
// We avoid Penpot canvas calls for now to keep this checkpoint clean
// Later we will import canvas types from '@penpot/plugin-types' and draw

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T

const btn = $('#btn') as HTMLButtonElement
const promptEl = $('#prompt') as HTMLTextAreaElement
const apiEl = $('#api') as HTMLInputElement
const out = $('#out') as HTMLPreElement

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
    const data = await res.json()
    out.textContent = JSON.stringify(data, null, 2)
  } catch (e) {
    out.textContent = `Fetch error: ${String(e)}`
  }
})

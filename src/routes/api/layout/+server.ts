// GET /api/layout?q=...
// Returns layout JSON for Penpot plugin consumption

import type { RequestHandler } from '@sveltejs/kit'
import { parsePrompt } from '$lib/parsers/prompt'
import { layoutParsed } from '$lib/utils/layout'

export const GET: RequestHandler = async ({ url }) => {
  const q = url.searchParams.get('q') ?? ''
  const parsed = parsePrompt(q)

  if (parsed.errors.length) {
    return new Response(
      JSON.stringify({ ok: false, errors: parsed.errors }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    )
  }

  const layout = layoutParsed(parsed)
  // thin response for the plugin: only what it needs to draw
  const payload = {
    ok: true,
    nodes: layout.nodes.map(n => ({ id: n.id, name: n.name, year: n.year, x: n.x, y: n.y })),
    edges: layout.edges
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  })
}

// Optional OPTIONS for CORS preflight (some plugin setups may trigger it)
export const OPTIONS: RequestHandler = async () =>
  new Response(null, { status: 204 })

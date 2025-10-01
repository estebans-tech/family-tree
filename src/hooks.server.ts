// Allow your Penpot instance to fetch the API
// Set PENPOT_ORIGIN (e.g. https://design.penpot.app or your self-hosted URL)

import type { Handle } from '@sveltejs/kit'
import { PENPOT_ORIGIN } from '$env/static/private'

const ALLOW = new Set(
  (PENPOT_ORIGIN ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
)

export const handle: Handle = async ({ event, resolve }) => {
  const origin = event.request.headers.get('origin') ?? ''
  const isAllowed = ALLOW.has(origin)

  const response = await resolve(event, {
    filterSerializedResponseHeaders: name => name === 'content-type'
  })

  // add permissive CORS only for allowed origins
  const headers = new Headers(response.headers)
  if (isAllowed) {
    headers.set('access-control-allow-origin', origin)
    headers.set('access-control-allow-credentials', 'true')
    headers.set('access-control-allow-headers', 'content-type, authorization')
    headers.set('access-control-allow-methods', 'GET, OPTIONS')
  }

  return new Response(response.body, { status: response.status, headers })
}

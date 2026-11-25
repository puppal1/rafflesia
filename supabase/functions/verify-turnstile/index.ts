// created: 2026-11-24T23:40:00-08:00 — verify Cloudflare Turnstile token (secret server-side)
// Deploy: supabase functions deploy verify-turnstile
// Secret: supabase secrets set TURNSTILE_SECRET_KEY=...

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  // created: 2026-11-24T23:40:00-08:00
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }
  try {
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY') || ''
    if (!secret) {
      return new Response(JSON.stringify({ ok: false, error: 'Turnstile not configured' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const body = (await req.json()) as { token?: string }
    const token = String(body.token || '').trim()
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing token' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const form = new FormData()
    form.set('secret', secret)
    form.set('response', token)
    const cf = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const result = (await cf.json()) as { success?: boolean }
    return new Response(JSON.stringify({ ok: Boolean(result.success) }), {
      status: result.success ? 200 : 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'verify failed'
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

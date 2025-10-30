#!/usr/bin/env node
/**
 * Trigger the configured n8n webhook to exercise the email notifier.
 * Loads environment from .env (dotenv), so run from project root.
 *
 * Usage:
 *   node ./scripts/trigger-email-notifier.mjs
 *
 * The script posts a small JSON payload; adjust fields to match your n8n workflow.
 */

import 'dotenv/config'
import process from 'process'

const url = process.env.N8N_WEBHOOK_URL
if (!url) {
  console.error('N8N_WEBHOOK_URL not set in environment (.env).')
  process.exit(2)
}

const payload = {
  type: 'password-reset-test',
  email: process.argv[2] || 'dev-test@example.com',
  subject: 'Test password reset - notifier',
  body: 'This is an automated test trigger from the local dev environment.'
}

async function run() {
  try {
    console.log('Posting to n8n webhook:', url)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    console.log('Webhook response status:', res.status)
    console.log('Webhook response body:')
    console.log(text)

    if (!res.ok) process.exit(3)
  } catch (err) {
    console.error('Failed to call webhook:', err)
    process.exit(4)
  }
}

run()

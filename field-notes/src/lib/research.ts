import { createServerFn } from '@tanstack/react-start'

export const sourceGroups = [
  {
    id: 'energy',
    label: 'Energy',
    title: 'The electricity story is regional, not abstract.',
    body: 'AI runs inside data centers, and data centers draw from local grids. Berkeley Lab now projects US data centers at roughly 12% of national electricity by 2030, but the climate effect depends on when and where that electricity is generated.',
    signal: 'High confidence',
    source: 'US Department of Energy · Berkeley Lab, 2025 Update',
    href: 'https://escholarship.org/uc/item/33m6w3x0',
  },
  {
    id: 'climate',
    label: 'Climate',
    title: 'Carbon intensity changes the answer.',
    body: 'A model query is not a fixed amount of emissions. Hardware efficiency, utilization, cooling, grid mix, and whether new demand is matched with clean power all move the result. The IEA estimates data centers used about 485 TWh in 2025 and projects roughly 950 TWh by 2030.',
    signal: 'Important qualifier',
    source: 'International Energy Agency · Key Questions on Energy and AI, 2026',
    href: 'https://www.iea.org/reports/key-questions-on-energy-and-ai',
  },
  {
    id: 'water',
    label: 'Water',
    title: 'Water is a siting and accounting question.',
    body: 'Cooling systems can consume water directly, while power generation can consume water indirectly. A responsible comparison must name the boundary: direct facility water, full supply chain water, or both.',
    signal: 'Context needed',
    source: 'US Department of Energy · FEMP',
    href: 'https://www.energy.gov/sites/default/files/2024-07/best-practice-guide-data-center-design_0.pdf',
  },
  {
    id: 'materials',
    label: 'Materials',
    title: 'The footprint starts before the prompt.',
    body: 'Chips, servers, buildings, transmission, and replacement cycles carry embodied impacts. Operational energy is visible; extraction and manufacturing are easier to miss.',
    signal: 'Often omitted',
    source: 'UNEP · Global Resources Outlook 2024',
    href: 'https://www.resourcepanel.org/sites/default/files/documents/document/media/gro24_full_report_29feb_final_for_web.pdf',
  },
  {
    id: 'people',
    label: 'People',
    title: 'Training data has a human cost too.',
    body: 'Environmental accounting is only one part of the question. Data licensing, consent, labor conditions, and who captures the value of a model belong in the same ledger.',
    signal: 'Normative + factual',
    source: 'US Copyright Office · AI and Copyright',
    href: 'https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf',
  },
  {
    id: 'tradeoffs',
    label: 'Trade-offs',
    title: 'Use case matters more than ideology.',
    body: 'The relevant comparison is usually not “AI or nothing.” Compare the model-assisted workflow with the real alternative: a trip, a search session, a meeting, manual work, or another machine-learning system.',
    signal: 'Decision rule',
    source: 'IEA · Key Questions on Energy and AI, 2026',
    href: 'https://www.iea.org/reports/key-questions-on-energy-and-ai',
  },
]

export const quickQuestions = [
  'How much electricity does one AI question use?',
  'Is AI worse for the climate than a Google search?',
  'What does data-center growth mean for my state?',
]

export const methodNotes = [
  ['01', 'Name the boundary', 'Operational electricity, cooling water, embodied materials, and labor are different ledgers. Keep them separate.'],
  ['02', 'Show the uncertainty', 'Per-query estimates vary by model, prompt, hardware, and location. Ranges beat false precision.'],
  ['03', 'Compare the alternative', 'An impact claim needs a counterfactual: what would the person or organization do instead?'],
]

async function envString(name: string): Promise<string | undefined> {
  try {
    // This file is imported by the client; a static cloudflare:workers import would break that bundle.
    const { env } = await import('cloudflare:workers')
    const value = (env as unknown as Record<string, unknown>)[name]
    if (typeof value === 'string' && value.length > 0) return value
  } catch {
    // Local Vite without Worker bindings.
  }
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

async function searchKagi(question: string) {
  const key = await envString('KAGI_API_KEY')

  const response = await fetch('https://kagi.com/api/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: question, workflow: 'search', format: 'json', limit: 5 }),
  })
  if (!response.ok) return []
  const payload = await response.json() as {
    data?: { search?: Array<{ title?: string; snippet?: string; url?: string }> }
  }
  return Array.isArray(payload.data?.search)
    ? payload.data.search.slice(0, 5).map((item) => ({
        title: item.title ?? 'Untitled result',
        snippet: item.snippet ?? '',
        url: item.url ?? '',
      }))
    : []
}

const researchSystemPrompt = 'You are an evidence-first research assistant. Answer the user question about AI and environmental or social impact in plain language. Separate measured facts from estimates and value judgments. Never invent a number. Cite the provided source URLs inline. If the evidence is insufficient, say so.'

type ProviderResult = { answer: string } | { failure: string }

async function readProviderFailure(label: string, response: Response) {
  let detail = ''
  try {
    const payload = (await response.json()) as { error?: { message?: string }; message?: string }
    detail = payload.error?.message ?? payload.message ?? ''
  } catch {
    // Non-JSON error body; the status code still identifies the problem.
  }
  return `${label} ${response.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`
}

export const answerModels = [
  {
    id: 'muse-spark-1.3-free',
    name: 'Muse Spark 1.3 Free',
    endpoint: 'https://api.meta.ai/v1/chat/completions',
    upstream: 'muse-spark-1.3-contributor',
    keyVar: 'META_API_KEY',
    // Muse Spark spends most of its budget on reasoning tokens; a small cap
    // returns finish_reason "length" with empty content.
    maxTokens: 4000,
  },
  {
    id: 'deepseek-4.1',
    name: 'DeepSeek 4.1',
    endpoint: 'https://opencode.ai/zen/go/v1/chat/completions',
    upstream: 'deepseek-v4.1-flash',
    keyVar: 'OPENCODE_API_KEY',
    maxTokens: 3000,
    // opencode's go route rejects requests without a session id.
    needsSession: true,
  },
] as const

export type AnswerModelId = (typeof answerModels)[number]['id']

const ANSWER_ATTEMPT_TIMEOUT_MS = 45_000
const ANSWER_ATTEMPTS = 2

type AnswerAttempt =
  | { answer: string; servedBy: string }
  | { failure: string; retryable: boolean }

async function requestAnswerOnce(model: (typeof answerModels)[number], question: string, sourceContext: string): Promise<AnswerAttempt> {
  const apiKey = await envString(model.keyVar)
  if (!apiKey) return { failure: `${model.name}: ${model.keyVar} is not configured on the server.`, retryable: false }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'field-notes-ai-earth (+https://field-notes.awdnowusaa.cc)',
  }
  if ('needsSession' in model && model.needsSession) {
    headers['x-opencode-client'] = 'field-notes'
    headers['x-opencode-session'] = crypto.randomUUID()
  }

  let response: Response
  try {
    response = await fetch(model.endpoint, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(ANSWER_ATTEMPT_TIMEOUT_MS),
      body: JSON.stringify({
        model: model.upstream,
        reasoning_effort: 'high',
        max_tokens: model.maxTokens,
        messages: [
          { role: 'system', content: researchSystemPrompt },
          { role: 'user', content: `Question: ${question}\n\nEvidence library:\n${sourceContext}` },
        ],
      }),
    })
  } catch (error) {
    // A reasoning model that needs longer than the deadline will not finish on
    // a second try, so a timeout is reported instead of retried.
    const reason = error instanceof Error && error.name === 'TimeoutError'
      ? `no reply within ${ANSWER_ATTEMPT_TIMEOUT_MS / 1000}s`
      : 'request failed'
    return { failure: `${model.name}: ${reason}`, retryable: false }
  }

  if (!response.ok) {
    // 5xx and 429 are transient; 4xx is a configuration problem that a retry cannot fix.
    return { failure: await readProviderFailure(model.name, response), retryable: response.status >= 500 || response.status === 429 }
  }

  const payload = (await response.json()) as {
    model?: string
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
  }
  // Providers report upstream trouble inside a 2xx body, so the payload decides.
  if (payload.error) return { failure: `${model.name}: ${payload.error.message ?? 'provider rejected the request'}`, retryable: true }

  // Reasoning traces stay out of the answer: an empty completion is reported as
  // such instead of dressing up internal reasoning as a response.
  const choice = payload.choices?.[0]
  const answer = choice?.message?.content
  if (typeof answer !== 'string' || !answer.trim()) {
    const truncated = choice?.finish_reason === 'length' ? ` (ran out of tokens at max_tokens ${model.maxTokens})` : ''
    return { failure: `${model.name}: empty response${truncated}`, retryable: false }
  }

  return { answer, servedBy: payload.model ?? model.upstream }
}

async function answerWithModel(model: (typeof answerModels)[number], question: string, sourceContext: string) {
  let lastFailure: AnswerAttempt = { failure: `${model.name}: no answer`, retryable: false }
  for (let attempt = 1; attempt <= ANSWER_ATTEMPTS; attempt++) {
    const result = await requestAnswerOnce(model, question, sourceContext)
    if ('answer' in result) return result
    lastFailure = result
    if (!result.retryable || attempt === ANSWER_ATTEMPTS) break
    const { promise, resolve } = Promise.withResolvers<void>()
    setTimeout(resolve, 500)
    await promise
  }
  return lastFailure
}

export const answerResearchQuestion = createServerFn({ method: 'POST' })
  .validator((data: { question: string; modelId?: string }) => data)
  .handler(async ({ data }) => {
    const question = data.question.trim().slice(0, 500)
    if (!question) throw new Error('Ask a question to start a research pass.')

    const model = answerModels.find((item) => item.id === data.modelId) ?? answerModels[0]
    const liveResults = await searchKagi(question)
    const sourceContext = [...sourceGroups.map((item) => `${item.source}: ${item.body} (${item.href})`), ...liveResults.map((item) => `${item.title}: ${item.snippet} (${item.url})`)].join('\n')
    const result = await answerWithModel(model, question, sourceContext)
    if ('failure' in result) throw new Error(result.failure)

    return {
      answer: result.answer,
      servedBy: result.servedBy,
      modelName: model.name,
      sourceCount: sourceGroups.length + liveResults.length,
      liveSearch: liveResults.length > 0,
    }
  })

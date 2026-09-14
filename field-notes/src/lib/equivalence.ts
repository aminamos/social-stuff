export const places = [
  {
    id: 'seattle',
    name: 'Seattle',
    unit: '10 kBTU window / mini-split',
    kw: 0.9,
  },
  {
    id: 'minnesota',
    name: 'Minnesota',
    unit: '3-ton central AC',
    kw: 2.6,
  },
  {
    id: 'nyc',
    name: 'New York City',
    unit: '10 kBTU window unit',
    kw: 1.0,
  },
] as const

export const models = [
  {
    id: 'gpt-4o',
    name: 'GPT-6 Astra',
    kind: 'cloud' as const,
    queryWh: 0.3,
    outputTokens: 500,
    source: 'Epoch AI, Feb 2025 · 0.3 Wh / 500 output tokens',
  },
  {
    id: 'chatgpt-avg',
    name: 'GPT-5.6 Sol',
    kind: 'cloud' as const,
    queryWh: 0.34,
    outputTokens: 500,
    source: 'Sam Altman, Jun 2025 · 0.34 Wh per ChatGPT query',
  },
  {
    id: 'gemini-text',
    name: 'Gemini text prompt',
    kind: 'cloud' as const,
    queryWh: 0.24,
    outputTokens: 300,
    source: 'Google 2025 disclosure · 0.24 Wh per typical text prompt; 300-token query length from Oviedo et al. 2026',
  },
  {
    id: 'frontier-2026',
    name: '2026 frontier (>200 billion)',
    kind: 'cloud' as const,
    queryWh: 0.31,
    outputTokens: 300,
    source: 'Oviedo et al. 2026 · median 0.31 Wh / 300 output tokens',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-5.6 Luna',
    kind: 'cloud' as const,
    queryWh: 0.03,
    outputTokens: 500,
    source: 'Not measured. Scaled ~10× from GPT-4o using Epoch’s API-price note',
  },
  {
    id: 'reasoning',
    name: 'GPT-6 Astra (max reasoning)',
    kind: 'cloud' as const,
    queryWh: 3.91,
    outputTokens: 5000,
    source: 'Oviedo et al. 2026 · 3.91 Wh / 5,000 output tokens (test-time scaling)',
  },
  {
    id: 'local',
    name: 'Local (this computer)',
    kind: 'local' as const,
    queryWh: 0,
    outputTokens: 0,
    source: 'Wall power ÷ decode speed for a quantized local model. Not GPT-4o-class unless noted.',
  },
] as const

export const localDevices = [
  {
    id: 'gaming-pc',
    name: 'Beefy gaming PC',
    detail: 'RTX 4090-class · Llama 70B Q4 hybrid',
    watts: 400,
    tokensPerSec: 8,
  },
  {
    id: 'm5-mac-pro',
    name: 'M5 Mac Pro',
    detail: 'Unified memory · Llama 70B Q4',
    watts: 90,
    tokensPerSec: 18,
  },
  {
    id: 'mac-mini',
    name: 'Mac mini',
    detail: 'M4/M5 Pro · Llama 70B Q4',
    watts: 45,
    tokensPerSec: 7,
  },
  {
    id: 'dgx-spark',
    name: 'DGX Spark',
    detail: 'GB10 · ~150 W load · Llama 70B Q4',
    watts: 150,
    tokensPerSec: 25,
  },
  {
    id: 'macbook-air',
    name: 'MacBook Air',
    detail: '70B does not fit · Llama 8B Q4',
    watts: 18,
    tokensPerSec: 22,
  },
] as const

export type ModelId = (typeof models)[number]['id']
export type DeviceId = (typeof localDevices)[number]['id']

export function modelById(id: string) {
  return models.find((model) => model.id === id) ?? models[0]
}

export function deviceById(id: string) {
  return localDevices.find((device) => device.id === id) ?? localDevices[0]
}

export function whPerToken(modelId: string, deviceId: string) {
  const model = modelById(modelId)
  if (model.kind === 'local') {
    const device = deviceById(deviceId)
    return device.watts / (device.tokensPerSec * 3600)
  }
  return model.queryWh / model.outputTokens
}

export function equivalence(hours: number, kw: number, wattHoursPerToken: number, queryWh: number) {
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 0
  const wh = safeHours * kw * 1000
  const tokens = wattHoursPerToken > 0 ? wh / wattHoursPerToken : 0
  return {
    kwh: safeHours * kw,
    tokens,
    queries: queryWh > 0 ? wh / queryWh : 0,
  }
}

export function formatCount(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 1)} billion`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} million`
  return Math.round(n).toLocaleString('en-US')
}

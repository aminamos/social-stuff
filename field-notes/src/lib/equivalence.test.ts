import { describe, expect, it } from 'vitest'

import {
  deviceById,
  equivalence,
  formatCount,
  localDevices,
  modelById,
  models,
  places,
  whPerToken,
} from './equivalence'

describe('places (EIA-derived AC power draw)', () => {
  it('lists the three reference places with their kW ratings', () => {
    expect(places.map((p) => p.id)).toEqual(['seattle', 'minnesota', 'nyc'])
    expect(places.find((p) => p.id === 'seattle')!.kw).toBe(0.9)
    expect(places.find((p) => p.id === 'minnesota')!.kw).toBe(2.6)
    expect(places.find((p) => p.id === 'nyc')!.kw).toBe(1.0)
  })

  it('documents the appliance each kW figure refers to', () => {
    expect(places.find((p) => p.id === 'seattle')!.unit).toContain('10 kBTU')
    expect(places.find((p) => p.id === 'minnesota')!.unit).toContain('3-ton')
    expect(places.find((p) => p.id === 'nyc')!.unit).toContain('10 kBTU')
  })
})

describe('models (published per-query energy figures)', () => {
  it('locks in the Epoch AI Feb 2025 GPT-4o figure: 0.3 Wh / 500 output tokens', () => {
    const m = modelById('gpt-4o')
    expect(m.queryWh).toBe(0.3)
    expect(m.outputTokens).toBe(500)
    expect(m.kind).toBe('cloud')
    expect(m.source).toContain('Epoch AI')
  })

  it('locks in the Sam Altman Jun 2025 figure: 0.34 Wh per ChatGPT query', () => {
    const m = modelById('chatgpt-avg')
    expect(m.queryWh).toBe(0.34)
    expect(m.source).toContain('Altman')
  })

  it('locks in the Google 2025 disclosure: 0.24 Wh per text prompt, 300-token query', () => {
    const m = modelById('gemini-text')
    expect(m.queryWh).toBe(0.24)
    expect(m.outputTokens).toBe(300)
    expect(m.source).toContain('Google')
  })

  it('locks in the Oviedo et al. 2026 frontier figure: 0.31 Wh / 300 output tokens', () => {
    const m = modelById('frontier-2026')
    expect(m.queryWh).toBe(0.31)
    expect(m.outputTokens).toBe(300)
    expect(m.source).toContain('Oviedo')
  })

  it('locks in the Oviedo et al. 2026 test-time scaling figure: 3.91 Wh / 5000 tokens', () => {
    const m = modelById('reasoning')
    expect(m.queryWh).toBe(3.91)
    expect(m.outputTokens).toBe(5000)
    expect(m.source).toContain('Oviedo')
  })

  it('keeps the mini model at ~10x cheaper than GPT-4o and flags it as estimated', () => {
    const m = modelById('gpt-4o-mini')
    expect(m.queryWh).toBeCloseTo(modelById('gpt-4o').queryWh / 10, 10)
    expect(m.source).toContain('Not measured')
  })

  it('treats the local model as measured from wall power, not from a published figure', () => {
    const m = modelById('local')
    expect(m.kind).toBe('local')
    expect(m.queryWh).toBe(0)
    expect(m.outputTokens).toBe(0)
  })

  it('keeps per-token energy consistent with the published per-query figures', () => {
    for (const m of models) {
      if (m.kind !== 'cloud') continue
      expect(whPerToken(m.id, 'gaming-pc')).toBeCloseTo(m.queryWh / m.outputTokens, 12)
    }
  })
})

describe('localDevices (wall power / decode speed)', () => {
  it('locks in the watts and tokens/sec for each device', () => {
    const byId = Object.fromEntries(localDevices.map((d) => [d.id, d]))
    expect(byId['gaming-pc'].watts).toBe(400)
    expect(byId['gaming-pc'].tokensPerSec).toBe(8)
    expect(byId['m5-mac-pro'].watts).toBe(90)
    expect(byId['m5-mac-pro'].tokensPerSec).toBe(18)
    expect(byId['mac-mini'].watts).toBe(45)
    expect(byId['mac-mini'].tokensPerSec).toBe(7)
    expect(byId['dgx-spark'].watts).toBe(150)
    expect(byId['dgx-spark'].tokensPerSec).toBe(25)
    expect(byId['macbook-air'].watts).toBe(18)
    expect(byId['macbook-air'].tokensPerSec).toBe(22)
  })
})

describe('modelById / deviceById', () => {
  it('returns the matching entry', () => {
    expect(modelById('gemini-text').name).toBe('Gemini text prompt')
    expect(deviceById('dgx-spark').name).toBe('DGX Spark')
  })

  it('falls back to the first entry for unknown ids', () => {
    expect(modelById('nope')).toBe(models[0])
    expect(deviceById('nope')).toBe(localDevices[0])
  })
})

describe('whPerToken', () => {
  it('divides query energy by output tokens for cloud models', () => {
    expect(whPerToken('gpt-4o', 'gaming-pc')).toBeCloseTo(0.3 / 500, 12)
    expect(whPerToken('reasoning', 'gaming-pc')).toBeCloseTo(3.91 / 5000, 12)
    expect(whPerToken('frontier-2026', 'mac-mini')).toBeCloseTo(0.31 / 300, 12)
  })

  it('derives local per-token energy from wall watts / decode speed', () => {
    // gaming PC: 400 W at 8 tok/s -> 400 / (8 * 3600) Wh per token
    expect(whPerToken('local', 'gaming-pc')).toBeCloseTo(400 / (8 * 3600), 12)
    expect(whPerToken('local', 'macbook-air')).toBeCloseTo(18 / (22 * 3600), 12)
    expect(whPerToken('local', 'dgx-spark')).toBeCloseTo(150 / (25 * 3600), 12)
  })

  it('uses the requested device for local models', () => {
    expect(whPerToken('local', 'gaming-pc')).not.toBeCloseTo(
      whPerToken('local', 'macbook-air'),
      6,
    )
  })
})

describe('equivalence', () => {
  it('converts 1 hour of Seattle AC into GPT-4o tokens and queries', () => {
    // 1 h * 0.9 kW = 0.9 kWh = 900 Wh
    const r = equivalence(1, 0.9, 0.3 / 500, 0.3)
    expect(r.kwh).toBeCloseTo(0.9, 10)
    expect(r.tokens).toBeCloseTo(900 / (0.3 / 500), 6) // 1,500,000
    expect(r.queries).toBeCloseTo(900 / 0.3, 6) // 3,000
  })

  it('scales linearly with hours', () => {
    const one = equivalence(1, 2.6, 0.001, 0.5)
    const ten = equivalence(10, 2.6, 0.001, 0.5)
    expect(ten.kwh).toBeCloseTo(one.kwh * 10, 10)
    expect(ten.tokens).toBeCloseTo(one.tokens * 10, 6)
    expect(ten.queries).toBeCloseTo(one.queries * 10, 6)
  })

  it('treats non-positive or non-finite hours as zero', () => {
    for (const hours of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = equivalence(hours, 2.6, 0.001, 0.5)
      expect(r.kwh).toBe(0)
      expect(r.tokens).toBe(0)
      expect(r.queries).toBe(0)
    }
  })

  it('returns zero tokens when per-token energy is zero or negative', () => {
    expect(equivalence(1, 0.9, 0, 0.3).tokens).toBe(0)
    expect(equivalence(1, 0.9, -1, 0.3).tokens).toBe(0)
  })

  it('returns zero queries when per-query energy is zero or negative', () => {
    expect(equivalence(1, 0.9, 0.001, 0).queries).toBe(0)
    expect(equivalence(1, 0.9, 0.001, -1).queries).toBe(0)
  })
})

describe('formatCount', () => {
  it('returns 0 for non-positive or non-finite input', () => {
    expect(formatCount(0)).toBe('0')
    expect(formatCount(-42)).toBe('0')
    expect(formatCount(Number.NaN)).toBe('0')
    expect(formatCount(Number.POSITIVE_INFINITY)).toBe('0')
  })

  it('formats plain counts with locale separators', () => {
    expect(formatCount(999)).toBe('999')
    expect(formatCount(2700)).toBe('2,700')
  })

  it('formats millions and billions compactly', () => {
    expect(formatCount(1_350_000)).toBe('1.4 million')
    expect(formatCount(25_000_000)).toBe('25 million')
    expect(formatCount(1_350_000_000)).toBe('1.4 billion')
    expect(formatCount(15_000_000_000)).toBe('15 billion')
  })
})

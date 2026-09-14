import { useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { answerModels, answerResearchQuestion, methodNotes, quickQuestions, sourceGroups } from '../lib/research'
import {
  deviceById,
  equivalence,
  formatCount,
  localDevices,
  modelById,
  models,
  places,
  whPerToken,
} from '../lib/equivalence'

export const Route = createFileRoute('/')({
  component: ResearchHome,
})

const MIN_HOURS = 0
const MAX_HOURS = 48

function ArrowUp() {
  return <span aria-hidden="true" className="arrow-up">↗</span>
}

function EquivalenceDesk() {
  const [hoursText, setHoursText] = useState('1')
  const [modelId, setModelId] = useState<string>(models[0].id)
  const [deviceId, setDeviceId] = useState<string>(localDevices[0].id)
  const typedHours = Number.parseFloat(hoursText)
  const safeHours = Number.isFinite(typedHours) ? typedHours : 0
  const hours = Math.min(MAX_HOURS, Math.max(MIN_HOURS, safeHours))
  const overCap = safeHours > MAX_HOURS
  const model = modelById(modelId)
  const device = deviceById(deviceId)
  const tokenEnergy = whPerToken(modelId, deviceId)
  const isLocal = model.kind === 'local'

  return (
    <section className="equiv-section shell" id="top">
      <div className="equiv-toolbar">
        <h1>AC hours → inference tokens</h1>
        <div className="equiv-controls">
          <label>
            Hours of AC not run
            <input
              type="number"
              min={MIN_HOURS}
              max={MAX_HOURS}
              step={0.25}
              value={hoursText}
              onChange={(event) => setHoursText(event.target.value)}
              onBlur={() => setHoursText(String(hours))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur()
              }}
            />
            {overCap && <span className="control-hint">Capped at {MAX_HOURS} h</span>}
          </label>
          <label>
            Model
            <select value={modelId} onChange={(event) => setModelId(event.target.value)}>
              {models.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          {isLocal && (
            <label>
              Machine
              <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>
                {localDevices.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <table className="equiv-table">
        <thead>
          <tr>
            <th>Place</th>
            <th>Typical unit</th>
            <th>kWh</th>
            <th>{isLocal ? `${device.name} tokens` : `${model.name} output tokens`}</th>
            <th>{isLocal ? 'Decode time' : 'Queries'}</th>
          </tr>
        </thead>
        <tbody>
          {places.map((place) => {
            const result = equivalence(hours, place.kw, tokenEnergy, isLocal ? 0 : model.queryWh)
            const decodeMinutes = isLocal && device.tokensPerSec > 0
              ? result.tokens / device.tokensPerSec / 60
              : 0
            return (
              <tr key={place.id}>
                <th scope="row">{place.name}</th>
                <td>{place.unit} · {place.kw} kW</td>
                <td>{result.kwh.toFixed(2)}</td>
                <td><strong>{formatCount(result.tokens)}</strong></td>
                <td>
                  {isLocal
                    ? (decodeMinutes >= 60
                      ? `${(decodeMinutes / 60).toFixed(1)} hr`
                      : `${Math.round(decodeMinutes).toLocaleString('en-US')} min`)
                    : formatCount(result.queries)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="equiv-note">
        {isLocal
          ? `${device.detail}. ${device.watts} W ÷ ${device.tokensPerSec} tok/s = ${tokenEnergy.toFixed(5)} Wh/token.`
          : model.source}
        {' '}Compressor-on hours, not thermostat clock time.
        {' '}<a href="https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use" target="_blank" rel="noreferrer">Epoch AI</a>
        {' · '}
        <a href="https://www.devsustainability.com/p/energy-use-of-ai-inference-estimates" target="_blank" rel="noreferrer">Oviedo 2026</a>
        {' · '}
        <a href="https://www.eia.gov/consumption/residential/data/2020/c&e/pdf/ce4.6.pdf" target="_blank" rel="noreferrer">EIA RECS 2020</a>
      </p>
    </section>
  )
}

type AnswerBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }

const HEADING_LINE = /^(#{1,6})\s+(.*)$/
const BULLET_LINE = /^[-*+]\s+(.*)$/
const NUMBERED_LINE = /^\d+[.)]\s+(.*)$/
const INLINE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(\(?https?:\/\/[^\s)]*[A-Za-z0-9/#?=&%_-])\)?/g

function normaliseText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function linkLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    if (index > cursor) nodes.push(text.slice(cursor, index))
    const [full, markdownLabel, markdownUrl, bold, bareUrl] = match
    if (markdownUrl) {
      nodes.push(<a key={`${keyPrefix}-${index}`} href={markdownUrl} target="_blank" rel="noreferrer">{markdownLabel}</a>)
    } else if (bold) {
      nodes.push(<strong key={`${keyPrefix}-${index}`}>{bold}</strong>)
    } else {
      const url = (bareUrl ?? '').replace(/^\(+/, '').replace(/\)+$/, '')
      nodes.push(<a key={`${keyPrefix}-${index}`} href={url} target="_blank" rel="noreferrer" title={url}>{linkLabel(url)}</a>)
    }
    cursor = index + full.length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function buildAnswerBlocks(text: string, question: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = []
  const asked = normaliseText(question)
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    blocks.push({ kind: 'list', ordered: list.ordered, items: list.items })
    list = null
  }

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = HEADING_LINE.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      // The model often restates the question as a title; the card already showed it.
      if (!blocks.length && heading[1].length === 1 && normaliseText(heading[2]) === asked) continue
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() })
      continue
    }

    const bullet = BULLET_LINE.exec(line)
    const numbered = bullet ? null : NUMBERED_LINE.exec(line)
    if (bullet || numbered) {
      flushParagraph()
      const ordered = Boolean(numbered)
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push((bullet?.[1] ?? numbered?.[1] ?? '').trim())
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return blocks
}

function AnswerBody({ text, question }: { text: string; question: string }) {
  const blocks = buildAnswerBlocks(text, question)
  const baseLevel = blocks.some((block) => block.kind === 'heading' && block.level === 1) ? 1 : 2

  return (
    <>
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          const Heading = block.level <= baseLevel ? 'h3' : 'h4'
          return <Heading key={`block-${index}`}>{renderInline(block.text, `block-${index}`)}</Heading>
        }
        if (block.kind === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={`block-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`block-${index}-${itemIndex}`}>{renderInline(item, `block-${index}-${itemIndex}`)}</li>
              ))}
            </List>
          )
        }
        return <p key={`block-${index}`}>{renderInline(block.text, `block-${index}`)}</p>
      })}
    </>
  )
}

// The router may satisfy a request from a fallback target, so name what actually answered.
function servedLabel(answer: { servedBy: string; modelName: string }) {
  const short = answer.servedBy.split('/').pop()?.replace(/:free$/, '') ?? ''
  if (!short) return ''
  const flat = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const tokens = answer.modelName.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  return tokens.every((token) => flat(short).includes(token)) ? '' : `served ${short}`
}

function ResearchHome() {
  const [question, setQuestion] = useState('')
  const [modelId, setModelId] = useState<string>(answerModels[0].id)
  const [answer, setAnswer] = useState<{ answer: string; servedBy: string; modelName: string; sourceCount: number; liveSearch: boolean } | null>(null)
  const [error, setError] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const ask = useServerFn(answerResearchQuestion)

  const submitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!question.trim() || isAsking) return
    setError('')
    setAnswer(null)
    setIsAsking(true)
    try {
      setAnswer(await ask({ data: { question, modelId } }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The research pass could not start.')
    } finally {
      setIsAsking(false)
    }
  }

  const useQuestion = (value: string) => {
    setQuestion(value)
    setError('')
    document.getElementById('ask')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <main>
      <nav className="topbar shell" aria-label="Main navigation">
        <a className="wordmark" href="#top">Field Notes</a>
        <div className="nav-links">
          <a href="#research">Evidence</a>
          <a href="#method">Method</a>
          <a href="#sources">Sources</a>
          <a href="#ask">Ask</a>
        </div>
      </nav>

      <EquivalenceDesk />

      <section className="ask-section shell" id="ask">
        <form className="question-form" onSubmit={submitQuestion}>
          <div className="ask-head">
            <label htmlFor="question">Question</label>
            <label className="ask-model" htmlFor="answer-model">
              Model
              <select
                id="answer-model"
                value={modelId}
                onChange={(event) => setModelId(event.target.value)}
              >
                {answerModels.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Is AI worse for the climate than a search engine?"
            rows={3}
            maxLength={500}
          />
          <div className="form-footer">
            <span>{question.length}/500</span>
            <button type="submit" disabled={!question.trim() || isAsking}>
              {isAsking ? 'Researching…' : 'Ask'}
            </button>
          </div>
        </form>
        <div className="quick-questions">
          {quickQuestions.map((item) => (
            <button type="button" key={item} onClick={() => useQuestion(item)}>{item}</button>
          ))}
        </div>
        {isAsking && <div className="answer-state">Comparing the source list…</div>}
        {error && <div className="answer-state answer-error">{error}</div>}
        {answer && (
          <article className="answer-card">
            <div className="answer-card-head">
              <span>{answer.sourceCount} sources · {answer.liveSearch ? 'Kagi refreshed' : 'curated library'}</span>
              <span>{answer.modelName}{servedLabel(answer) ? ` · ${servedLabel(answer)}` : ''}</span>
            </div>
            <div className="answer-copy">
              <AnswerBody text={answer.answer} question={question} />
            </div>
          </article>
        )}
      </section>

      <section className="research-section shell" id="research">
        <h2>What the footprint includes</h2>
        <div className="evidence-list">
          {sourceGroups.map((item, index) => (
            <section className="evidence-row" id={item.id} key={item.id}>
              <div className="evidence-index">0{index + 1}</div>
              <div className="evidence-main">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <a href={item.href} target="_blank" rel="noreferrer">{item.source} <ArrowUp /></a>
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="method-section shell" id="method">
        <h2>How to read a number</h2>
        <div className="method-list">
          {methodNotes.map(([number, title, body]) => (
            <div className="method-row" key={number}>
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sources-section shell" id="sources">
        <h2>Sources</h2>
        <div className="source-links">
          {sourceGroups.map((item) => (
            <a key={item.source} href={item.href} target="_blank" rel="noreferrer">
              <span>{item.source}</span>
              <ArrowUp />
            </a>
          ))}
        </div>
      </section>

      <footer className="footer shell">
        <span>Field Notes / AI & Earth</span>
        <a href="#top">Top</a>
      </footer>
    </main>
  )
}

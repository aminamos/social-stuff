import type { ReactNode } from 'react'
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Field Notes · AI & Earth' },
      { name: 'description', content: 'An evidence-first guide to AI, energy, water, materials, and people.' },
    ],
  }),
  component: RootDocument,
  notFoundComponent: NotFoundComponent,
})

function RootDocument() {
  return (
    <DocumentFrame>
      <Outlet />
    </DocumentFrame>
  )
}

function DocumentFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function NotFoundComponent() {
  return (
    <main>
      <nav className="topbar shell" aria-label="Main navigation">
        <Link className="wordmark" to="/">Field Notes</Link>
        <div className="nav-links">
          <Link to="/">Back to Field Notes</Link>
        </div>
      </nav>
      <section className="shell" style={{ paddingBlock: '64px' }}>
        <h2>Page not found</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '520px', marginBottom: '24px' }}>
          This page does not exist. Return to the Field Notes home page.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '10px 16px',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          Return Home
        </Link>
      </section>
      <footer className="footer shell">
        <span>Field Notes / AI & Earth</span>
      </footer>
    </main>
  )
}

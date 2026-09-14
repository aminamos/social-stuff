import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

// Document responses carry no validators, so a browser can keep serving a page whose
// hashed asset bundle no longer exists. Force revalidation on every page load.
const documentCacheMiddleware = createMiddleware().server(async (ctx) => {
  const result = await ctx.next()
  const contentType = result.response.headers.get('content-type')
  if (ctx.handlerType === 'router' && contentType?.includes('text/html')) {
    result.response.headers.set('Cache-Control', 'no-cache, must-revalidate')
  }
  return result
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, documentCacheMiddleware],
}))

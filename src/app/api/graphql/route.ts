import { createYoga } from 'graphql-yoga'
import { type NextRequest } from 'next/server'
import { schema } from '@/lib/graphql/schema'
import { buildContext } from '@/lib/graphql/builder'

const { handleRequest } = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',

  // GraphiQL IDE available in dev at http://localhost:3000/api/graphql
  graphiql: process.env.NODE_ENV === 'development',

  context: () => buildContext(),
})

// NextRequest extends Request, so the cast is safe at runtime.
// The wrapper is needed to satisfy Next.js App Router's route handler types.
const handler = (req: NextRequest) => handleRequest(req, {})
export { handler as GET, handler as POST, handler as OPTIONS }

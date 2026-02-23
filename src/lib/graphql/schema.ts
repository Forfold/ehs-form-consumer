import { builder } from './builder'
import './mutations'
import './queries'
import './types'

// ── Export ────────────────────────────────────────────────────────────────────
export const schema = builder.toSchema()

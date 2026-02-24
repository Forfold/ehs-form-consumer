import { builder } from './builder'
import './mutations'
import './queries'
import './types'

export const schema = builder.toSchema()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

let _client: PrismaClient | undefined

function getClient() {
	if (!_client) {
		const connectionString = process.env.DATABASE_URL
		const pool = new pg.Pool({ connectionString })
		const adapter = new PrismaPg(pool)
		_client = new PrismaClient({ adapter })
		if (process.env.NODE_ENV !== 'production') {
			;(globalThis as unknown as { __prismaClient?: PrismaClient }).__prismaClient = _client
		}
	}
	return _client
}

const handler: ProxyHandler<Record<PropertyKey, unknown>> = {
	get(_, prop: PropertyKey) {
		const client = getClient()
		const val = (client as unknown as Record<PropertyKey, unknown>)[prop]
		if (typeof val === 'function') return (val as Function).bind(client)
		return val
	},
}

export const prisma = new Proxy({} as Record<PropertyKey, unknown>, handler) as unknown as PrismaClient

export default prisma

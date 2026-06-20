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
			;(globalThis as any).__prismaClient = _client
		}
	}
	return _client
}

const handler: ProxyHandler<Record<string, any>> = {
	get(_, prop) {
		const client = getClient()
		// @ts-ignore
		return client[prop]
	},
}

export const prisma = new Proxy({}, handler) as unknown as PrismaClient

export default prisma

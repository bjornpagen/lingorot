import "dotenv/config"
import { db } from "@/db"
import { sql, getTableName } from "drizzle-orm"
import * as schema from "@/db/schema"

async function dropTables() {
	const tables = [
		schema.verification,
		schema.session,
		schema.account,
		schema.user
	]

	for (const table of tables) {
		const tableName = getTableName(table)
		const exists = await db.execute(
			sql`SELECT EXISTS (
				SELECT FROM information_schema.tables
				WHERE table_name = ${tableName}
			)`
		)
		const tableExists = exists.rows[0].exists
		if (tableExists) {
			console.log(`Dropping ${tableName}...`)
			await db.execute(sql`DROP TABLE IF EXISTS ${table} CASCADE`)
			console.log(`✓ ${tableName}`)
		}
	}
}

dropTables()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error dropping tables:", error)
		process.exit(1)
	})

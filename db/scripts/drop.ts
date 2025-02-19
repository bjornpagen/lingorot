import "dotenv/config"
import { db } from "@/db"
import { sql, getTableName } from "drizzle-orm"
import * as schema from "@/db/schema"

async function dropTables() {
	const tables = [
		schema.videoPlaybackEvent,
		schema.chatMessage,
		schema.videoWord,
		schema.userChallengeWord,
		schema.challengePeer,
		schema.userChallenge,
		schema.userLanguageLevel,
		schema.userInterest,
		schema.challenge,
		schema.video,
		schema.sectionFrame,
		schema.sectionAudio,
		schema.file,
		schema.bookSectionTranslation,
		schema.bookSection,
		schema.book,
		schema.subInterest,
		schema.interest,
		schema.verification,
		schema.session,
		schema.account,
		schema.user,
		schema.language,
		schema.gutenbergBookSubject,
		schema.gutenbergFormat,
		schema.gutenbergPerson,
		schema.gutenbergSubject,
		schema.gutenbergBook
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

	const enums = [
		schema.playbackEventType,
		schema.difficulty,
		schema.expiryType,
		schema.chatRole,
		schema.cefrLevel,
		schema.languageCode
	]
	for (const enumType of enums) {
		const exists = await db.execute(
			sql`SELECT EXISTS (
				SELECT FROM pg_type
				WHERE typname = ${enumType.enumName}
			)`
		)
		const enumExists = exists.rows[0].exists
		if (enumExists) {
			console.log(`Dropping enum ${enumType.enumName}...`)
			await db.execute(
				sql`DROP TYPE IF EXISTS ${sql.raw(enumType.enumName)} CASCADE`
			)
			console.log(`✓ ${enumType.enumName}`)
		}
	}
}

dropTables()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error dropping tables:", error)
		process.exit(1)
	})

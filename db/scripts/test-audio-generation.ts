import "dotenv/config"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateSectionAudio } from "@/lib/ai/audio-generator"
import { getPresignedUrl } from "@/lib/s3"

const GUTENBERG_ID = 84 // Frankenstein
const LANGUAGE_CODE = "es" as const
const CEFR_LEVEL = "A1" as const

async function testAudioGeneration() {
	console.log(`Testing audio generation for Gutenberg book ${GUTENBERG_ID}...`)

	try {
		const book = await db
			.select({
				id: schema.book.id
			})
			.from(schema.book)
			.where(eq(schema.book.gutenbergId, GUTENBERG_ID))
			.then((results) => results[0])

		if (!book) {
			throw new Error("Book not found - run test-gutenberg.ts first")
		}

		const section = await db
			.select({
				id: schema.bookSection.id,
				name: schema.bookSection.name
			})
			.from(schema.bookSection)
			.where(eq(schema.bookSection.bookId, book.id))
			.then((results) => results[0])

		if (!section) {
			throw new Error("No sections found for book")
		}

		console.log("\nGenerating audio for section:", section.name)
		await generateSectionAudio(section.id, LANGUAGE_CODE, CEFR_LEVEL)

		const audioEntries = await db
			.select({
				id: schema.sectionAudio.id,
				fileId: schema.sectionAudio.fileId,
				durationMs: schema.sectionAudio.durationMs,
				position: schema.sectionAudio.position
			})
			.from(schema.sectionAudio)
			.where(eq(schema.sectionAudio.bookSectionId, section.id))
			.orderBy(schema.sectionAudio.position)

		console.log(`\nGenerated ${audioEntries.length} audio entries:`)
		for (const entry of audioEntries) {
			const signedUrl = await getPresignedUrl(entry.fileId)
			console.log(
				`Audio ${entry.id}`,
				`\n  ID: ${entry.id}`,
				`\n  Position: ${entry.position}`,
				`\n  Duration: ${(entry.durationMs / 1000).toFixed(1)}s`,
				`\n  URL: ${signedUrl}`
			)
		}
	} catch (error) {
		console.error("\n❌ Error in audio generation process:", error)
		if (error instanceof Error) {
			console.error("Stack trace:", error.stack)
		}
		process.exit(1)
	}
}

testAudioGeneration()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Unexpected error:", error)
		process.exit(1)
	})

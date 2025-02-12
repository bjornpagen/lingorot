import "dotenv/config"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { generateVideo } from "@/lib/ai/video-generator"

const GUTENBERG_ID = 84
const LANGUAGE_CODE = "es" as const
const CEFR_LEVEL = "A1" as const

async function testVideoGenerator() {
	console.log("\n🚀 Starting video generation test")
	console.log(`📚 Using Gutenberg book ID: ${GUTENBERG_ID}`)
	console.log(`🌍 Language: ${LANGUAGE_CODE}`)
	console.log(`📊 CEFR Level: ${CEFR_LEVEL}\n`)

	try {
		const book = await db
			.select({
				id: schema.book.id
			})
			.from(schema.book)
			.where(eq(schema.book.gutenbergId, GUTENBERG_ID))
			.then((results) => results[0])

		if (!book) {
			throw new Error("❌ Book not found - run test-gutenberg.ts first")
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
			throw new Error("❌ No sections found for book")
		}

		console.log("📖 Using section:", section.name)
		const videoPath = await generateVideo(section.id, LANGUAGE_CODE, CEFR_LEVEL)

		console.log("\n✨ Video generation completed successfully!")
		console.log("📍 Video saved at:", videoPath)

		const audioCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.sectionAudio)
			.where(eq(schema.sectionAudio.bookSectionId, section.id))
			.then((results) => results[0]?.count ?? 0)

		const frameCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.sectionFrame)
			.where(eq(schema.sectionFrame.bookSectionId, section.id))
			.then((results) => results[0]?.count ?? 0)

		console.log("\n📊 Final Stats:")
		console.log(`🔊 Audio segments: ${audioCount}`)
		console.log(`🖼️  Scene frames: ${frameCount}`)
	} catch (error) {
		console.error("\n❌ Error in video generation process:", error)
		if (error instanceof Error) {
			console.error("Stack trace:", error.stack)
		}
		process.exit(1)
	}
}

testVideoGenerator()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Unexpected error:", error)
		process.exit(1)
	})

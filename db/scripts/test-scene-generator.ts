import "dotenv/config"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateSceneDescriptions } from "@/lib/ai/scene-generator"
import { generateAndSaveSectionFrames } from "@/lib/ai/image-generator"
import { getPresignedUrl } from "@/lib/s3"

const GUTENBERG_ID = 84

async function testSceneGenerator() {
	console.log(`Testing scene generation for Gutenberg book ${GUTENBERG_ID}...`)

	try {
		const book = await db
			.select()
			.from(schema.book)
			.where(eq(schema.book.gutenbergId, GUTENBERG_ID))
			.then((results) => results[0])

		if (!book) {
			throw new Error("Book not found - run test-gutenberg.ts first")
		}

		const section = await db
			.select()
			.from(schema.bookSection)
			.where(eq(schema.bookSection.bookId, book.id))
			.then((results) => results[0])

		if (!section) {
			throw new Error("No sections found for book")
		}

		console.log("\nGenerating scene descriptions for section:", section.name)
		const scenes = await generateSceneDescriptions(section.content)

		if (!scenes.length) {
			throw new Error("No scenes were generated")
		}

		console.log("\nGenerated Scene Descriptions:")
		for (const [index, scene] of scenes.entries()) {
			console.log(`\nScene ${index + 1}:`)
			console.log(`Original Paragraph: "${scene.paragraph}"`)
			console.log(`Description: ${scene.description}`)
		}

		console.log("\nGenerating and saving section frames...")
		await generateAndSaveSectionFrames(scenes, section.id, section.content)

		const frames = await db
			.select({
				id: schema.sectionFrame.id,
				fileId: schema.sectionFrame.fileId,
				displayPercentage: schema.sectionFrame.displayPercentage
			})
			.from(schema.sectionFrame)
			.where(eq(schema.sectionFrame.bookSectionId, section.id))
			.orderBy(schema.sectionFrame.displayPercentage)

		console.log(`\nGenerated ${frames.length} frames:`)
		for (const frame of frames) {
			const signedUrl = await getPresignedUrl(frame.fileId)
			console.log(
				`Frame at ${(frame.displayPercentage * 100).toFixed(1)}%`,
				`\n  ID: ${frame.id}`,
				`\n  URL: ${signedUrl}`
			)
		}
	} catch (error) {
		console.error("\n❌ Error in scene generation process:", error)
		if (error instanceof Error) {
			console.error("Stack trace:", error.stack)
		}
		process.exit(1)
	}
}

testSceneGenerator()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Unexpected error:", error)
		process.exit(1)
	})

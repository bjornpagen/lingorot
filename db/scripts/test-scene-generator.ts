import "dotenv/config"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateSceneDescriptions } from "@/lib/ai/scene-generator"
import { generateImagesFromScenes } from "@/lib/ai/image-generator"
import { writeFile } from "node:fs/promises"
import { join } from "node:path"

const GUTENBERG_ID = 84 // Frankenstein

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

		console.log("\nGenerated Scene Descriptions:")
		for (const [index, scene] of scenes.entries()) {
			console.log(`\nScene ${index + 1}:`)
			console.log(`Original Paragraph: "${scene.paragraph}"`)
			console.log(`Description: ${scene.description}`)
		}

		console.log("\nGenerating images from scenes...")
		const images = await generateImagesFromScenes(scenes, section.id)

		// For testing, save images to disk
		const outputDir = join(process.cwd(), "generated-images")
		for (const [index, image] of images.entries()) {
			const filename = join(
				outputDir,
				`section_${image.sectionId}_pos_${image.position}.webp`
			)
			await writeFile(filename, image.imageData)
			console.log(`Saved image ${index + 1} to ${filename}`)
			console.log(`Section: ${image.sectionId}, Position: ${image.position}`)
			console.log(`Prompt: ${image.prompt}\n`)
		}
	} catch (error) {
		console.error("Error generating scenes:", error)
		process.exit(1)
	}
}

testSceneGenerator()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Unexpected error:", error)
		process.exit(1)
	})

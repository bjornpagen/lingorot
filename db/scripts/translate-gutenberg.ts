import "dotenv/config"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { transcribeText } from "@/lib/ai/transcribe"

const GUTENBERG_ID = 84 // Frankenstein by Mary Shelley
const TARGET_LANGUAGE = "Finnish"
const TARGET_REGION = "Finland"
const CEFR_LEVEL = "A1" as const

async function getFormattedTranslation(bookId: string) {
	const result = await db
		.select({
			title: schema.book.title,
			author: schema.book.author,
			content: sql<string>`string_agg(
				concat('\n# ', ${schema.bookSection.name}, '\n\n', ${schema.bookSectionTranslation.content}, '\n'),
				'\n'
				ORDER BY ${schema.bookSection.position}
			)`
		})
		.from(schema.book)
		.leftJoin(schema.bookSection, eq(schema.book.id, schema.bookSection.bookId))
		.leftJoin(
			schema.bookSectionTranslation,
			eq(schema.bookSection.id, schema.bookSectionTranslation.sectionId)
		)
		.where(eq(schema.book.id, bookId))
		.groupBy(schema.book.id, schema.book.title, schema.book.author)
		.then((results) => results[0])

	if (!result) {
		throw new Error("Book not found")
	}

	return result
}

async function translateGutenberg() {
	console.log(
		`Starting translation of Gutenberg book ${GUTENBERG_ID} to ${TARGET_LANGUAGE} (${CEFR_LEVEL})...`
	)

	try {
		const book = await db
			.select()
			.from(schema.book)
			.where(eq(schema.book.gutenbergId, GUTENBERG_ID))
			.then((results) => results[0])

		if (!book) {
			throw new Error("Book not found - run test-gutenberg.ts first")
		}

		console.log(`Found book: ${book.title} by ${book.author}`)

		const sections = await db
			.select()
			.from(schema.bookSection)
			.where(eq(schema.bookSection.bookId, book.id))
			.orderBy(schema.bookSection.position)

		console.log(`Found ${sections.length} sections to translate`)

		for (const section of sections) {
			console.log(`\nTranslating section: ${section.name}`)

			const existingTranslation = await db
				.select()
				.from(schema.bookSectionTranslation)
				.where(eq(schema.bookSectionTranslation.sectionId, section.id))
				.then((results) => results[0])

			if (existingTranslation) {
				console.log("Translation already exists, skipping...")
				continue
			}

			const translatedContent = await transcribeText(
				section.content,
				TARGET_LANGUAGE,
				TARGET_REGION,
				CEFR_LEVEL
			)

			if (!translatedContent) {
				throw new Error(`Failed to translate section ${section.name}`)
			}

			await db.insert(schema.bookSectionTranslation).values({
				sectionId: section.id,
				languageId: "fi",
				region: TARGET_REGION,
				content: translatedContent,
				cefrLevel: CEFR_LEVEL
			})

			console.log(`✓ Translated section ${section.name}`)
		}

		console.log("\nTranslation completed successfully!")

		const formattedTranslation = await getFormattedTranslation(book.id)
		console.log("\n=== Complete Translated Book Content ===\n")
		console.log(
			`${formattedTranslation.title} by ${formattedTranslation.author}\n`
		)
		console.log(formattedTranslation.content)
	} catch (error) {
		console.error("Error translating book:", error)
		process.exit(1)
	}
}

translateGutenberg()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Unexpected error:", error)
		process.exit(1)
	})

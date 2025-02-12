import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"
import { transcribeText } from "@/lib/ai/transcribe"

type CEFRLevel = (typeof schema.cefrLevel.enumValues)[number]
type LanguageCode = (typeof schema.languageCode.enumValues)[number]

export type TranslationOptions = {
	targetLanguage: LanguageCode
	cefrLevel: CEFRLevel
}

export async function getFormattedTranslation(bookId: string) {
	console.log("\nFetching formatted translation for book ID:", bookId)
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

export async function translateGutenbergBook(
	gutenbergId: number,
	targetLanguage: LanguageCode,
	cefrLevel: CEFRLevel
) {
	console.log("\nLooking up book in database...")
	const book = await db
		.select({
			id: schema.book.id
		})
		.from(schema.book)
		.where(eq(schema.book.gutenbergId, gutenbergId))
		.then((results) => results[0])

	if (!book) {
		throw new Error("Book not found - run test-gutenberg.ts first")
	}
	console.log("Found book with ID:", book.id)

	console.log("\nFetching all book sections...")
	const sections = await db
		.select()
		.from(schema.bookSection)
		.where(eq(schema.bookSection.bookId, book.id))
		.orderBy(schema.bookSection.position)

	console.log(`Found ${sections.length} sections to process`)

	for (const [index, section] of sections.entries()) {
		console.log(
			`\nProcessing section ${index + 1}/${sections.length}: "${section.name}"`
		)
		console.log(
			`Content preview: ${section.content.slice(0, 150).replace(/\s+/g, " ")}...`
		)

		console.log("Checking for existing translation...")
		const existingTranslation = await db
			.select()
			.from(schema.bookSectionTranslation)
			.where(
				and(
					eq(schema.bookSectionTranslation.sectionId, section.id),
					eq(schema.bookSectionTranslation.languageId, targetLanguage),
					eq(schema.bookSectionTranslation.cefrLevel, cefrLevel)
				)
			)
			.then((results) => results[0])

		if (existingTranslation) {
			console.log("✓ Translation already exists, skipping...")
			continue
		}

		console.log("No existing translation found, generating new translation...")
		const translatedContent = await transcribeText(
			section.content,
			targetLanguage,
			cefrLevel
		)

		if (!translatedContent) {
			throw new Error(`Failed to translate section ${section.name}`)
		}

		console.log(
			"Translation preview:",
			`${translatedContent.slice(0, 150).replace(/\s+/g, " ")}...`
		)

		console.log("Saving translation to database...")
		await db.insert(schema.bookSectionTranslation).values({
			sectionId: section.id,
			languageId: targetLanguage,
			content: translatedContent,
			cefrLevel
		})
		console.log("✓ Translation saved successfully")
	}

	console.log("\n✓ All sections processed successfully")
	return book.id
}

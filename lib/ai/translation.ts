import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { transcribeText } from "@/lib/ai/transcribe"

export type TranslationOptions = {
	targetLanguage: string
	targetRegion: string
	cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
}

export async function getFormattedTranslation(bookId: string) {
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
	options: TranslationOptions
) {
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

	const sections = await db
		.select()
		.from(schema.bookSection)
		.where(eq(schema.bookSection.bookId, book.id))
		.orderBy(schema.bookSection.position)

	for (const section of sections) {
		const existingTranslation = await db
			.select()
			.from(schema.bookSectionTranslation)
			.where(eq(schema.bookSectionTranslation.sectionId, section.id))
			.then((results) => results[0])

		if (existingTranslation) {
			continue
		}

		const translatedContent = await transcribeText(
			section.content,
			options.targetLanguage,
			options.targetRegion,
			options.cefrLevel
		)

		if (!translatedContent) {
			throw new Error(`Failed to translate section ${section.name}`)
		}

		await db.insert(schema.bookSectionTranslation).values({
			sectionId: section.id,
			languageId: "fi",
			region: options.targetRegion,
			content: translatedContent,
			cefrLevel: options.cefrLevel
		})
	}

	return book.id
}

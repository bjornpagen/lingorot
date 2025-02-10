import "dotenv/config"
import { importGutenbergBook } from "@/lib/gutenberg/import"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql } from "drizzle-orm"

const GUTENBERG_ID = 84 // Frankenstein by Mary Shelley

async function getFormattedBook(bookId: string) {
	const result = await db
		.select({
			title: schema.book.title,
			author: schema.book.author,
			content: sql<string>`string_agg(
				concat('\n# ', ${schema.bookSection.name}, '\n\n', ${schema.bookSection.content}, '\n'),
				'\n'
				ORDER BY ${schema.bookSection.position}
			)`
		})
		.from(schema.book)
		.leftJoin(schema.bookSection, eq(schema.book.id, schema.bookSection.bookId))
		.where(eq(schema.book.id, bookId))
		.groupBy(schema.book.id, schema.book.title, schema.book.author)
		.then((results) => results[0])

	if (!result) {
		throw new Error("Book not found")
	}

	return result
}

async function testGutenberg() {
	console.log(`Starting import of Gutenberg book ${GUTENBERG_ID}...`)

	try {
		const bookId = await importGutenbergBook(GUTENBERG_ID)
		console.log(`Successfully imported book with ID: ${bookId}`)

		const book = await db
			.select()
			.from(schema.book)
			.where(eq(schema.book.id, bookId))
			.then((results) => results[0])

		if (!book) {
			throw new Error("Book not found after import")
		}

		console.log("\n=== Book Metadata ===")
		console.log(`Title: ${book.title}`)
		console.log(`Author: ${book.author}`)
		console.log(`Language: ${book.languageId}`)

		const formattedBook = await getFormattedBook(bookId)
		console.log("\n=== Complete Book Content ===\n")
		console.log(`${formattedBook.title} by ${formattedBook.author}\n`)
		console.log(formattedBook.content)
	} catch (error) {
		console.error("Error importing book:", error)
		process.exit(1)
	}
}

testGutenberg()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Unexpected error:", error)
		process.exit(1)
	})

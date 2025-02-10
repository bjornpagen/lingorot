import "dotenv/config"
import { importGutenbergBook } from "@/lib/gutenberg/import"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { asc, eq } from "drizzle-orm"

const GUTENBERG_ID = 84 // Frankenstein by Mary Shelley

async function testGutenberg() {
	console.log(`Starting import of Gutenberg book ${GUTENBERG_ID}...`)

	try {
		const bookId = await importGutenbergBook(GUTENBERG_ID)
		console.log(`Successfully imported book with ID: ${bookId}`)

		const bookResults = await db
			.select()
			.from(schema.book)
			.where(eq(schema.book.id, bookId))
			.leftJoin(
				schema.bookSection,
				eq(schema.book.id, schema.bookSection.bookId)
			)
			.orderBy(asc(schema.bookSection.position))

		if (!bookResults.length) {
			throw new Error("Book not found after import")
		}

		const bookData = bookResults[0].book
		console.log("\n=== Book Metadata ===")
		console.log(`Title: ${bookData.title}`)
		console.log(`Author: ${bookData.author}`)
		console.log(`Language: ${bookData.languageId}`)
		console.log("\n=== Book Content ===")

		for (const result of bookResults) {
			if (result.book_section) {
				console.log(`\n--- ${result.book_section.name} ---\n`)
				console.log(result.book_section.content)
			}
		}
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

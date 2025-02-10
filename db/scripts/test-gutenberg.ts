import "dotenv/config"
import { importGutenbergBook } from "@/lib/gutenberg/import"

const GUTENBERG_ID = 84 // Frankenstein by Mary Shelley

async function testGutenberg() {
	console.log(`Starting import of Gutenberg book ${GUTENBERG_ID}...`)

	try {
		const bookId = await importGutenbergBook(GUTENBERG_ID)
		console.log(`Successfully imported book with ID: ${bookId}`)
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

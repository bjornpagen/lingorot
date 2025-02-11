import "dotenv/config"
import {
	translateGutenbergBook,
	getFormattedTranslation
} from "@/lib/ai/translation"

const GUTENBERG_ID = 84 // Frankenstein by Mary Shelley
const TARGET_LANGUAGE = "es" as const
const CEFR_LEVEL = "A1" as const

async function translateGutenberg() {
	console.log(
		`Starting translation of Gutenberg book ${GUTENBERG_ID} to ${TARGET_LANGUAGE} (${CEFR_LEVEL})...`
	)

	try {
		const bookId = await translateGutenbergBook(
			GUTENBERG_ID,
			TARGET_LANGUAGE,
			CEFR_LEVEL
		)

		console.log("\nTranslation completed successfully!")

		const formattedTranslation = await getFormattedTranslation(bookId)
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

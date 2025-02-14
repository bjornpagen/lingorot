import "dotenv/config"
import { findSimilarBooks } from "./generate-embeddings"

async function main() {
	const query = process.argv.slice(2).join(" ")
	if (!query) {
		console.error("Please provide a search query")
		console.error("Usage: tsx db/scripts/search-books.ts <search query>")
		process.exit(1)
	}

	try {
		console.log(`Searching for books similar to: "${query}"`)
		const results = await findSimilarBooks(query)

		console.log("\nResults:")
		for (const { title, summary, similarity } of results) {
			console.log("\n---")
			console.log(`Title: ${title}`)
			console.log(`Similarity: ${(similarity * 100).toFixed(2)}%`)
			console.log(`Summary: ${summary}`)
		}

		process.exit(0)
	} catch (error) {
		console.error("Error during search:", error)
		process.exit(1)
	}
}

if (require.main === module) {
	main()
}

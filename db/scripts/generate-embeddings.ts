import "dotenv/config"
import OpenAI from "openai"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { cosineDistance, desc, eq, isNotNull, isNull, sql } from "drizzle-orm"

const BATCH_SIZE = 1000

function chunkify<T>(array: T[]): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < array.length; i += BATCH_SIZE) {
		chunks.push(array.slice(i, i + BATCH_SIZE))
	}
	return chunks
}

if (!process.env.OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY is not set")
}

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
})

async function generateEmbedding(text: string): Promise<number[]> {
	const input = text.replaceAll("\n", " ")
	const { data } = await openai.embeddings.create({
		model: "text-embedding-3-small",
		input
	})
	return data[0].embedding
}

async function generateBookEmbedding(
	title: string,
	summary: string,
	retryCount = 0
): Promise<number[]> {
	try {
		const text = `title: ${title}\nsummary: ${summary}`
		return await generateEmbedding(text)
	} catch (error) {
		if (error instanceof Error) {
			console.error(
				`Attempt ${retryCount + 1} failed for "${title}":`,
				error.message
			)
		}
		const delayMs = Math.min(1000 * 2 ** retryCount, 32000)
		console.log(`Retrying in ${delayMs / 1000} seconds...`)
		await new Promise((resolve) => setTimeout(resolve, delayMs))
		return generateBookEmbedding(title, summary, retryCount + 1)
	}
}

async function generateEmbeddings() {
	console.log("Starting embedding generation...")

	const books = await db
		.select({
			id: schema.gutenbergBook.id,
			title: schema.gutenbergBook.title,
			summary: schema.gutenbergBook.summary
		})
		.from(schema.gutenbergBook)
		.where(isNull(schema.gutenbergBook.embedding))

	console.log(`Found ${books.length} books without embeddings`)

	const chunks = chunkify(books)
	for (const [chunkIndex, chunk] of chunks.entries()) {
		console.log(
			`\nProcessing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} books)`
		)

		const updates = await Promise.all(
			chunk.map(async (book) => {
				try {
					console.log(`Processing book: ${book.title}`)
					const embedding = await generateBookEmbedding(
						book.title,
						book.summary
					)
					return {
						id: book.id,
						embedding
					}
				} catch (error) {
					console.error(`Error processing book ${book.id}:`, error)
					return null
				}
			})
		)

		const validUpdates = updates.filter(
			(update): update is NonNullable<typeof update> => update !== null
		)

		if (validUpdates.length > 0) {
			for (const update of validUpdates) {
				await db
					.update(schema.gutenbergBook)
					.set({ embedding: update.embedding })
					.where(eq(schema.gutenbergBook.id, update.id))
			}
			console.log(`✓ Updated ${validUpdates.length} books in current chunk`)
		}
	}

	console.log("\nEmbedding generation completed!")
}

async function findSimilarBooks(query: string, limit = 5) {
	console.log(`Searching for books similar to: "${query}"`)

	const embedding = await generateEmbedding(query)
	const similarity = sql<number>`1 - (${cosineDistance(
		schema.gutenbergBook.embedding,
		embedding
	)})`

	const results = await db
		.select({
			title: schema.gutenbergBook.title,
			summary: schema.gutenbergBook.summary,
			similarity
		})
		.from(schema.gutenbergBook)
		.orderBy(desc(similarity))
		.where(isNotNull(schema.gutenbergBook.embedding))
		.limit(limit)

	return results
}

if (require.main === module) {
	generateEmbeddings()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("Error:", error)
			process.exit(1)
		})
}

export { findSimilarBooks }

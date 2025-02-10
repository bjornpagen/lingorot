//import "server-only"

import { db } from "@/db"
import * as schema from "@/db/schema"
import { stripGutenbergText } from "@/lib/gutenberg/parse"
import { extractTextSections } from "@/lib/ai/sections"

import UserAgent from "user-agents"
import ISO6391 from "iso-639-1"
import { eq } from "drizzle-orm"

/**
 * Fetches raw text content from Project Gutenberg using Node's built-in fetch
 * with Safari-like headers to avoid blocking.
 */
async function fetchGutenbergText(gutenbergId: number): Promise<string> {
	const userAgent = new UserAgent(/Safari/).toString()
	const path = `/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`
	const url = `https://www.gutenberg.org${path}`

	const response = await fetch(url, {
		method: "GET",
		headers: {
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Encoding": "gzip, deflate, br",
			"Accept-Language": "en-US,en;q=0.9",
			Priority: "u=0, i",
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "none",
			"User-Agent": userAgent
		}
	})

	if (!response.ok) {
		throw new Error(
			`Failed to fetch Gutenberg text (ID: ${gutenbergId}). HTTP ${response.status}`
		)
	}

	return response.text()
}

/**
 * Fetches a Gutenberg text by ID using Node's built-in fetch, mimicking Safari headers,
 * strips headers/footers, splits into sections, and stores them in the database within
 * a single Drizzle transaction.
 *
 * @param gutenbergId The Gutenberg book ID
 */
export async function importGutenbergBook(
	gutenbergId: number
): Promise<string> {
	const existingBook = await db
		.select()
		.from(schema.book)
		.where(eq(schema.book.gutenbergId, gutenbergId))
		.limit(1)
		.then((res) => res[0])
	if (existingBook) {
		return existingBook.id
	}

	const fullText = await fetchGutenbergText(gutenbergId)
	const strippedText = stripGutenbergText(fullText)
	const metadata = parseGutenbergHeader(fullText)

	if (!metadata.title) {
		throw new Error(`Missing title in Gutenberg text (ID: ${gutenbergId}).`)
	}
	if (!metadata.author) {
		throw new Error(`Missing author in Gutenberg text (ID: ${gutenbergId}).`)
	}
	if (!metadata.language) {
		throw new Error(`Missing language in Gutenberg text (ID: ${gutenbergId}).`)
	}

	const { title, author, language: languageId } = metadata
	const sectionsInfo = await extractTextSections(strippedText)
	const lines = strippedText.split("\n")

	return await db.transaction(async (tx) => {
		const [insertedBook] = await tx
			.insert(schema.book)
			.values({
				gutenbergId,
				title,
				author,
				languageId
			})
			.returning({ id: schema.book.id })

		if (!insertedBook) {
			throw new Error("Failed to insert book")
		}

		for (let i = 0; i < sectionsInfo.length; i++) {
			const section = sectionsInfo[i]
			if (!section) {
				continue
			}

			const content = lines
				.slice(section.firstLine - 1, section.lastLine)
				.join("\n")
				.trim()

			await tx.insert(schema.bookSection).values({
				bookId: insertedBook.id,
				name: section.name ?? "Untitled Section",
				position: i + 1,
				content
			})
		}

		return insertedBook.id
	})
}

/**
 * Parses the Gutenberg header to extract the title, author, and language.
 *
 * @param text The full Gutenberg text
 * @returns An object containing the title, author, and language code
 */
function parseGutenbergHeader(text: string) {
	const headerEndMarker = "*** START OF THE PROJECT GUTENBERG EBOOK"
	const headerSection = text.split(headerEndMarker)[0]

	if (!headerSection) {
		throw new Error("Missing header in Gutenberg text.")
	}

	const titleMatch = headerSection.match(/Title:\s*(.+)/i)
	const authorMatch = headerSection.match(/Author:\s*(.+)/i)
	const languageMatch = headerSection.match(/Language:\s*(.+)/i)

	if (!titleMatch || !authorMatch || !languageMatch) {
		throw new Error("Missing metadata in Gutenberg text.")
	}

	if (!titleMatch[1] || !authorMatch[1] || !languageMatch[1]) {
		throw new Error("Missing metadata in Gutenberg text.")
	}

	const title = titleMatch[1].trim()
	const author = authorMatch[1].trim()
	const languageName = languageMatch[1].trim()
	const language = ISO6391.getCode(languageName)

	return {
		title,
		author,
		language
	}
}

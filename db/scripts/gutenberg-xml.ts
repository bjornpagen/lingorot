import "dotenv/config"
import { XMLParser } from "fast-xml-parser"
import { lt } from "drizzle-orm"
import {
	gutenbergBook,
	gutenbergPerson,
	gutenbergFormat,
	gutenbergSubject,
	gutenbergBookSubject
} from "../schema"
import * as zlib from "node:zlib"
import { db } from "@/db/index"

const GUTENBERG_XML_URL =
	"https://www.gutenberg.org/cache/epub/feeds/pgmarc.xml.gz"

const BATCH_SIZE = 5000

function chunkify<T>(array: T[]): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < array.length; i += BATCH_SIZE) {
		chunks.push(array.slice(i, i + BATCH_SIZE))
	}
	return chunks
}

type Record = {
	controlfield?:
		| Array<{ tag: string; value: string }>
		| { tag: string; value: string }
	datafield?: Array<DataField> | DataField
	download_count?: string
}

type DataField = {
	tag: string
	subfield?: Array<SubField> | SubField
	// biome-ignore lint/suspicious/noExplicitAny: ai generated mickey moused fucked shit
	[ind: string]: any
}

type SubField = {
	code: string
	value: string
}

function getControlField(record: Record, tag: string): string | undefined {
	const fields = record.controlfield
	if (!fields) {
		return undefined
	}
	if (Array.isArray(fields)) {
		return fields.find((field) => field.tag === tag)?.value
	}
	return fields.tag === tag ? fields.value : undefined
}

function findDatafield(record: Record, tag: string): DataField[] {
	const fields = record.datafield
	if (!fields) {
		return []
	}
	if (Array.isArray(fields)) {
		return fields.filter((f) => f.tag === tag)
	}
	return fields.tag === tag ? [fields] : []
}

function findSubfield(datafield: DataField, code: string): string | undefined {
	const fields = datafield.subfield
	if (!fields) {
		return undefined
	}
	if (Array.isArray(fields)) {
		return fields.find((sf) => sf.code === code)?.value
	}
	return fields.code === code ? fields.value : undefined
}

function getRequiredField(record: Record, tag: string): DataField {
	const field = findDatafield(record, tag)[0]
	if (!field) {
		throw new Error(`Missing required field: ${tag}`)
	}
	return field
}

function getRequiredSubfield(field: DataField, code: string): string {
	const value = findSubfield(field, code)
	if (value === undefined || value === null) {
		throw new Error(`Missing required subfield: ${code}`)
	}
	return String(value).trim()
}

function parsePublicationDetails(field: DataField): {
	place: string
	publisher: string
	date: Date
} {
	const place = getRequiredSubfield(field, "a").replace(/[:]+$/, "").trim()
	const publisher = getRequiredSubfield(field, "b").replace(/[,]+$/, "").trim()
	const dateStr = getRequiredSubfield(field, "c").trim()
	let date = new Date(dateStr)
	if (Number.isNaN(date.getTime()) && /^\d{4}$/.test(dateStr)) {
		date = new Date(`${dateStr}-01-01`)
	}
	return { place, publisher, date }
}

async function processBook(record: Record, syncStartTime: Date) {
	const gutenbergId = getControlField(record, "001")
	if (!gutenbergId) {
		throw new Error("Missing Gutenberg ID")
	}
	const id = Number.parseInt(gutenbergId, 10)
	if (Number.isNaN(id)) {
		throw new Error(`Invalid Gutenberg ID: ${gutenbergId}`)
	}
	const downloads = record.download_count
		? Number.parseInt(record.download_count, 10)
		: 0
	const titleField = getRequiredField(record, "245")
	const langField = getRequiredField(record, "041")
	let summary = ""
	const summaryFields = findDatafield(record, "520")
	if (Array.isArray(summaryFields) && summaryFields.length) {
		summary = summaryFields
			.map((field) => getRequiredSubfield(field, "a"))
			.join("\n\n")
	} else if (summaryFields.length) {
		summary = getRequiredSubfield(summaryFields[0], "a")
	}
	if (!summary) {
		console.log(`Skipping book ${id}: No summary available`)
		return
	}
	let pubField = findDatafield(record, "264")[0]
	if (!pubField) {
		pubField = findDatafield(record, "260")[0]
		if (!pubField) {
			console.log(`Skipping book ${id}: No publication field available`)
			return
		}
	}
	const { place, publisher, date } = parsePublicationDetails(pubField)
	if (!place || !publisher || !date) {
		console.log(`Skipping book ${id}: Missing publication details`)
		return
	}
	const title = getRequiredSubfield(titleField, "a")
	if (!title) {
		console.log(`Skipping book ${id}: No title available`)
		return
	}
	const language = getRequiredSubfield(langField, "a")
	if (!language) {
		console.log(`Skipping book ${id}: No language available`)
		return
	}
	const bookData = {
		gutenbergId: id,
		title,
		language,
		summary,
		downloadCount: downloads,
		publicationPlace: place,
		publisher,
		publishedAt: date
	}
	console.log(`Processing book ${id}:`, bookData)
	const bookId = await db
		.insert(gutenbergBook)
		.values(bookData)
		.onConflictDoUpdate({
			target: gutenbergBook.gutenbergId,
			set: {
				...bookData,
				updatedAt: syncStartTime
			}
		})
		.returning({ id: gutenbergBook.id })
		.then((res: { id: string }[]) => res[0].id)
	await Promise.all([
		processAuthor(record, syncStartTime),
		processFormats(record, bookId, syncStartTime),
		processSubjects(record, bookId, syncStartTime)
	])
	return bookId
}

/**
 * Imports Gutenberg XML data into the new tables.
 *
 * @param xmlContent - The Gutenberg XML content.
 */
export async function importGutenbergXML(xmlContent: string): Promise<void> {
	console.log("Starting Gutenberg XML import...")
	const syncStartTime = new Date()
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		removeNSPrefix: true,
		textNodeName: "value"
	})
	console.log("Parsing XML content...")
	const parsed = parser.parse(xmlContent)
	const records: Record[] = Array.isArray(parsed.collection.record)
		? parsed.collection.record
		: [parsed.collection.record]
	console.log(`Found ${records.length} records to process`)

	for (const chunk of chunkify(records)) {
		console.log(`Processing chunk of ${chunk.length} records...`)
		await Promise.all(chunk.map((record) => processBook(record, syncStartTime)))
	}

	console.log("Cleaning up old records...")
	await db
		.delete(gutenbergBookSubject)
		.where(lt(gutenbergBookSubject.updatedAt, syncStartTime))
	await db
		.delete(gutenbergSubject)
		.where(lt(gutenbergSubject.updatedAt, syncStartTime))
	await db
		.delete(gutenbergFormat)
		.where(lt(gutenbergFormat.updatedAt, syncStartTime))
	await db
		.delete(gutenbergPerson)
		.where(lt(gutenbergPerson.updatedAt, syncStartTime))
	await db
		.delete(gutenbergBook)
		.where(lt(gutenbergBook.updatedAt, syncStartTime))
	console.log("Import completed successfully")
}

async function processAuthor(
	record: Record,
	syncStartTime: Date
): Promise<void> {
	const primaryAuthors = findDatafield(record, "100")
	const additionalAuthors = findDatafield(record, "700")
	const authorFields: DataField[] = []
	if (primaryAuthors.length) {
		authorFields.push(...primaryAuthors)
	}
	if (additionalAuthors.length) {
		authorFields.push(...additionalAuthors)
	}
	if (!authorFields.length) {
		console.log("No author field found")
		return
	}
	for (const authorField of authorFields) {
		const authorName = findSubfield(authorField, "a")
		if (!authorName) {
			console.log("No author name found")
			continue
		}
		console.log("Processing author:", {
			name: authorName,
			details: findSubfield(authorField, "d")
		})
		await db
			.insert(gutenbergPerson)
			.values({
				name: authorName,
				details: findSubfield(authorField, "d")
			})
			.onConflictDoUpdate({
				target: gutenbergPerson.name,
				set: {
					details: findSubfield(authorField, "d"),
					updatedAt: syncStartTime
				}
			})
	}
}

async function processFormats(
	record: Record,
	bookId: string,
	syncStartTime: Date
): Promise<void> {
	const formatFields = findDatafield(record, "856")
	console.log(`Found ${formatFields.length} format fields`)
	for (const formatField of formatFields) {
		const url = findSubfield(formatField, "a")
		if (!url) {
			console.log("Skipping format: No URL found")
			continue
		}
		const extMatch = url.match(/\.(\w+)(?:\?|$)/)
		const formatType = extMatch ? extMatch[1] : "ebook"
		console.log("Processing format:", {
			formatType,
			url,
			description: findSubfield(formatField, "y")
		})
		await db
			.insert(gutenbergFormat)
			.values({
				bookId,
				formatType,
				url,
				description: findSubfield(formatField, "y")
			})
			.onConflictDoUpdate({
				target: [gutenbergFormat.bookId, gutenbergFormat.url],
				set: {
					formatType,
					description: findSubfield(formatField, "y"),
					updatedAt: syncStartTime
				}
			})
	}
}

async function processSubjects(
	record: Record,
	bookId: string,
	syncStartTime: Date
): Promise<void> {
	const subjectFields = findDatafield(record, "653")
	console.log(`Found ${subjectFields.length} subject fields`)
	for (const subjectField of subjectFields) {
		const subjectValue = findSubfield(subjectField, "a")
		if (!subjectValue) {
			console.log("Skipping subject: No value found")
			continue
		}
		console.log("Processing subject:", { name: subjectValue })
		const subjectId = await db
			.insert(gutenbergSubject)
			.values({ name: subjectValue })
			.onConflictDoUpdate({
				target: gutenbergSubject.name,
				set: {
					name: subjectValue,
					updatedAt: syncStartTime
				}
			})
			.returning({ id: gutenbergSubject.id })
			.then((res: { id: string }[]) => res[0].id)
		console.log("Creating book-subject relationship:", { bookId, subjectId })
		await db
			.insert(gutenbergBookSubject)
			.values({ bookId, subjectId })
			.onConflictDoUpdate({
				target: [gutenbergBookSubject.bookId, gutenbergBookSubject.subjectId],
				set: {
					bookId,
					subjectId,
					updatedAt: syncStartTime
				}
			})
	}
}

async function main() {
	try {
		console.log("Fetching Gutenberg XML dump...")
		const response = await fetch(GUTENBERG_XML_URL, {
			headers: {
				"Accept-Encoding": "gzip"
			}
		})
		if (!response.ok) {
			throw new Error(
				`Failed to fetch: ${response.status} ${response.statusText}`
			)
		}
		const contentEncoding = response.headers.get("content-encoding")
		console.log("Content-Encoding:", contentEncoding)
		const buffer = Buffer.from(await response.arrayBuffer())
		console.log("Received buffer size:", buffer.length)
		const isGzip = buffer[0] === 0x1f && buffer[1] === 0x8b
		let decompressed: Buffer
		if (contentEncoding === "gzip" && isGzip) {
			console.log("Manually decompressing gzipped data...")
			decompressed = zlib.gunzipSync(buffer)
		} else {
			console.log("Data is already decompressed or not gzipped, using as-is...")
			decompressed = buffer
		}
		console.log("Decompressed size:", decompressed.length)
		const xmlContent = decompressed.toString("utf-8")
		console.log("Starting Gutenberg XML import...")
		await importGutenbergXML(xmlContent)
		process.exit(0)
	} catch (error) {
		console.error("Error during import:", error)
		process.exit(1)
	}
}

if (require.main === module) {
	main()
}

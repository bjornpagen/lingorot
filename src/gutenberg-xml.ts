import { XMLParser } from "fast-xml-parser"
import { createId } from "@paralleldrive/cuid2"
import {
	char,
	pgTable,
	integer,
	text,
	timestamp,
	uniqueIndex,
	check
} from "drizzle-orm/pg-core"
import { sql, lt } from "drizzle-orm"

export const gutenbergBook = pgTable(
	"gutenberg_book",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		gutenbergId: integer("gutenberg_id").notNull(),
		title: text("title").notNull(),
		language: text("language").notNull(),
		summary: text("summary").notNull(),
		downloadCount: integer("download_count").notNull(),
		publisher: text("publisher").notNull(),
		publicationPlace: text("publication_place").notNull(),
		publishedAt: timestamp("published_at", { mode: "date" }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	(table) => [
		uniqueIndex("gutenberg_book_gutenberg_id_idx").on(table.gutenbergId),
		check("gutenberg_book_id_length", sql`length(${table.id}) = 24`)
	]
)

export const gutenbergPerson = pgTable(
	"gutenberg_person",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		name: text("name").notNull(),
		details: text("details"),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	(table) => [
		uniqueIndex("gutenberg_person_name_idx").on(table.name),
		check("gutenberg_person_id_length", sql`length(${table.id}) = 24`)
	]
)

export const gutenbergFormat = pgTable(
	"gutenberg_format",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		bookId: char("book_id", { length: 24 })
			.notNull()
			.references(() => gutenbergBook.id),
		formatType: text("format_type").notNull(),
		url: text("url").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	(table) => [
		uniqueIndex("gutenberg_format_book_url_idx").on(table.bookId, table.url),
		check("gutenberg_format_id_length", sql`length(${table.id}) = 24`)
	]
)

export const gutenbergSubject = pgTable(
	"gutenberg_subject",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		name: text("name").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	(table) => [
		uniqueIndex("gutenberg_subject_name_idx").on(table.name),
		check("gutenberg_subject_id_length", sql`length(${table.id}) = 24`)
	]
)

export const gutenbergBookSubject = pgTable(
	"gutenberg_book_subject",
	{
		bookId: char("book_id", { length: 24 })
			.notNull()
			.references(() => gutenbergBook.id),
		subjectId: char("subject_id", { length: 24 })
			.notNull()
			.references(() => gutenbergSubject.id),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: timestamp("updated_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
			.$onUpdateFn(() => new Date())
	},
	(table) => [
		uniqueIndex("gutenberg_book_subject_idx").on(table.bookId, table.subjectId)
	]
)

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
}

type SubField = {
	code: string
	value: string
}

function getControlField(record: Record, tag: string): string | undefined {
	const { controlfield: fields } = record
	if (!fields) {
		return undefined
	}

	if (Array.isArray(fields)) {
		return fields.find((field) => field.tag === tag)?.value
	}

	return fields.tag === tag ? fields.value : undefined
}

function findDatafield(record: Record, tag: string): DataField[] {
	const { datafield: fields } = record
	if (!fields) {
		return []
	}

	if (Array.isArray(fields)) {
		return fields.filter((f) => f.tag === tag)
	}

	return fields.tag === tag ? [fields] : []
}

function findSubfield(datafield: DataField, code: string): string | undefined {
	const { subfield: fields } = datafield
	if (!fields) {
		return undefined
	}

	if (Array.isArray(fields)) {
		return fields.find((sf) => sf.code === code)?.value
	}

	return fields.code === code ? fields.value : undefined
}

// First, let's add a type for our database transaction
type Transaction = {
	insert: (table: unknown) => {
		values: (data: unknown) => {
			onConflictDoUpdate: (options: unknown) => {
				returning: (columns: unknown) => Promise<Array<{ id: string }>>
			}
		}
	}
	delete: (table: unknown) => {
		where: (condition: unknown) => Promise<void>
	}
}

/**
 * Imports Gutenberg XML data into the new tables.
 *
 * @param xmlContent - The Gutenberg XML content.
 * @param db - The database instance.
 */
export async function importGutenbergXML(
	xmlContent: string,
	db: { transaction: (fn: (tx: Transaction) => Promise<void>) => Promise<void> }
): Promise<void> {
	const syncStartTime = new Date()

	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "",
		removeNSPrefix: true,
		textNodeName: "value"
	})

	const parsed = parser.parse(xmlContent)
	const records: Record[] = Array.isArray(parsed.collection.record)
		? parsed.collection.record
		: [parsed.collection.record]

	for (const record of records) {
		await db.transaction(async (tx: Transaction) => {
			const gutenbergIdStr = getControlField(record, "001")
			if (!gutenbergIdStr) {
				throw new Error("Missing Gutenberg ID")
			}

			const gutenbergId = Number.parseInt(gutenbergIdStr, 10)
			if (Number.isNaN(gutenbergId)) {
				return
			}

			const titleField = findDatafield(record, "245")[0]
			const langField = findDatafield(record, "041")[0]
			const summaryField = findDatafield(record, "520")[0]

			if (!record.download_count) {
				throw new Error("Missing download count")
			}
			const downloadCount = Number.parseInt(record.download_count, 10)

			const bookId = await tx
				.insert(gutenbergBook)
				.values({
					gutenbergId,
					title: findSubfield(titleField, "a"),
					language: findSubfield(langField, "a"),
					summary: findSubfield(summaryField, "a"),
					downloadCount
				})
				.onConflictDoUpdate({
					target: gutenbergBook.gutenbergId,
					set: {
						title: findSubfield(titleField, "a"),
						language: findSubfield(langField, "a"),
						summary: findSubfield(summaryField, "a"),
						downloadCount,
						updatedAt: syncStartTime
					}
				})
				.returning({ id: gutenbergBook.id })
				.then((res: { id: string }[]) => res[0].id)

			await processAuthor(record, tx, syncStartTime)
			await processFormats(record, bookId, tx, syncStartTime)
			await processSubjects(record, bookId, tx, syncStartTime)
		})
	}

	await db.transaction(async (tx: Transaction) => {
		await tx
			.delete(gutenbergBookSubject)
			.where(lt(gutenbergBookSubject.updatedAt, syncStartTime))

		await tx
			.delete(gutenbergSubject)
			.where(lt(gutenbergSubject.updatedAt, syncStartTime))

		await tx
			.delete(gutenbergFormat)
			.where(lt(gutenbergFormat.updatedAt, syncStartTime))

		await tx
			.delete(gutenbergPerson)
			.where(lt(gutenbergPerson.updatedAt, syncStartTime))

		await tx
			.delete(gutenbergBook)
			.where(lt(gutenbergBook.updatedAt, syncStartTime))
	})
}

async function processAuthor(
	record: Record,
	tx: Transaction,
	syncStartTime: Date
): Promise<void> {
	const authorField = findDatafield(record, "100")[0]
	if (!authorField) {
		return
	}

	const authorName = findSubfield(authorField, "a")
	if (!authorName) {
		return
	}

	await tx
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

async function processFormats(
	record: Record,
	bookId: string,
	tx: Transaction,
	syncStartTime: Date
): Promise<void> {
	const formatFields = findDatafield(record, "856")

	for (const formatField of formatFields) {
		const url = findSubfield(formatField, "a")
		if (!url) {
			continue
		}

		const formatType = url.split(".").pop()
		await tx
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
	tx: Transaction,
	syncStartTime: Date
): Promise<void> {
	const subjectFields = findDatafield(record, "650")

	for (const subjectField of subjectFields) {
		const subjectValue = findSubfield(subjectField, "a")
		if (!subjectValue) {
			continue
		}

		const subjectId = await tx
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

		await tx
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

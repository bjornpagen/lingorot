import { createId } from "@paralleldrive/cuid2"
import {
	char,
	pgTableCreator,
	timestamp,
	text,
	index
} from "drizzle-orm/pg-core"

export const createTable = pgTableCreator((name) => `lingorot_${name}`)

const baseColumns = {
	id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
	createdAt: timestamp("created_at", { mode: "date" })
		.notNull()
		.$default(() => new Date())
}

export const languages = createTable(
	"language",
	{
		...baseColumns,
		code: text("code").notNull().unique(),
		name: text("name").notNull(),
		emoji: text("emoji").notNull()
	},
	(table) => [index("languages_code_idx").on(table.code)]
)

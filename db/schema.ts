import {
	boolean,
	char,
	date,
	pgTable,
	text,
	timestamp
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

export const user = pgTable("user", {
	id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
	name: text("name").notNull(),
	email: text("email").notNull(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at")
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}))

export const session = pgTable("session", {
	id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
	userId: char("user_id", { length: 24 })
		.notNull()
		.references(() => user.id),
	token: text("token").notNull(),
	expiresAt: date("expires_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at")
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}))

export const account = pgTable("account", {
	id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
	userId: char("user_id", { length: 24 })
		.notNull()
		.references(() => user.id),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	accessTokenExpiresAt: date("access_token_expires_at"),
	refreshTokenExpiresAt: date("refresh_token_expires_at"),
	scope: text("scope"),
	idToken: text("id_token"),
	password: text("password"),
	createdAt: timestamp("created_at")
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}))

export const verification = pgTable("verification", {
	id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: date("expires_at").notNull(),
	createdAt: timestamp("created_at")
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date())
})

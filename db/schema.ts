import { createId } from "@paralleldrive/cuid2"
import {
	char,
	pgTableCreator,
	timestamp,
	text,
	integer,
	boolean,
	index,
	pgEnum,
	check,
	primaryKey,
	date
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm"

export const createTable = pgTableCreator((name) => `lingorot_${name}`)

export const user = createTable("user", {
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
		.$onUpdateFn(() => new Date()),
	bio: text("bio").notNull().default(""),
	challengesCompleted: integer("challenges_completed").notNull().default(0),
	wordsLearned: integer("words_learned").notNull().default(0),
	minutesWatched: integer("minutes_watched").notNull().default(0),
	daysStreak: integer("days_streak").notNull().default(0),
	currentLanguageId: char("current_language_id", { length: 2 })
		.references(() => language.code)
		.notNull()
		.default("en")
})

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}))

export const session = createTable("session", {
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

export const account = createTable("account", {
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

export const verification = createTable("verification", {
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

// END OF BETTERAUTH TABLES

export const difficulty = pgEnum("difficulty", [
	"beginner",
	"intermediate",
	"advanced"
])

export const expiryType = pgEnum("expiry_type", ["claims", "date"])

export const language = createTable(
	"language",
	{
		code: char("code", { length: 2 }).primaryKey().notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		name: text("name").notNull(),
		emoji: text("emoji").notNull()
	},
	(table) => [index("languages_code_idx").on(table.code)]
)

export const challenge = createTable(
	"challenge",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		title: text("title").notNull(),
		description: text("description").notNull(),
		points: integer("points").notNull(),
		expiryType: expiryType("expiry_type").notNull(),
		expiry: timestamp("expiry", { mode: "date" }),
		maxClaims: integer("max_claims"),
		currentClaims: integer("current_claims").notNull().default(0),
		progressTotal: integer("progress_total").notNull(),
		difficulty: difficulty("difficulty").notNull()
	},
	(table) => [
		index("challenges_title_idx").on(table.title),
		check(
			"check_expiry_constraint",
			sql`(
				(${table.expiryType} = 'claims' AND ${table.maxClaims} IS NOT NULL AND ${table.expiry} IS NULL) OR
				(${table.expiryType} = 'date' AND ${table.expiry} IS NOT NULL AND ${table.maxClaims} IS NULL)
			)`
		)
	]
)

export const userChallenge = createTable(
	"user_challenge",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		userId: char("user_id", { length: 24 })
			.notNull()
			.references(() => user.id),
		challengeId: char("challenge_id", { length: 24 })
			.notNull()
			.references(() => challenge.id),
		progressTotal: integer("progress_total").notNull(),
		progressCurrent: integer("progress_current").notNull().default(0)
	},
	(table) => [
		index("user_challenges_user_id_idx").on(table.userId),
		index("user_challenges_challenge_id_idx").on(table.challengeId)
	]
)

export const userChallengeWord = createTable(
	"user_challenge_word",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		userChallengeId: char("user_challenge_id", { length: 24 })
			.notNull()
			.references(() => userChallenge.id),
		word: text("word").notNull(),
		dateDiscovered: timestamp("date_discovered", { mode: "date" }).notNull(),
		dateLastSeen: timestamp("date_last_seen", { mode: "date" })
	},
	(table) => [
		index("user_challenge_word_user_challenge_id_idx").on(table.userChallengeId)
	]
)

export const challengePeer = createTable(
	"challenge_peer",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		challengeId: char("challenge_id", { length: 24 })
			.notNull()
			.references(() => challenge.id),
		peerId: text("peer_id").notNull(),
		name: text("name").notNull(),
		progress: integer("progress").notNull(),
		avatarUrl: text("avatar_url").notNull()
	},
	(table) => [index("challenge_peers_challenge_id_idx").on(table.challengeId)]
)

export const interest = createTable(
	"interest",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		name: text("name").notNull()
	},
	(table) => [index("interests_name_idx").on(table.name)]
)

export const subInterest = createTable(
	"sub_interest",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		interestId: char("interest_id", { length: 24 })
			.notNull()
			.references(() => interest.id),
		name: text("name").notNull(),
		selected: boolean("selected").notNull().default(false)
	},
	(table) => [index("sub_interests_interest_id_idx").on(table.interestId)]
)

export const video = createTable(
	"video",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		title: text("title").notNull(),
		description: text("description").notNull().default(""),
		muxAssetId: text("mux_asset_id").notNull(),
		muxPlaybackId: text("mux_playback_id").notNull(),
		muxTranscript: text("mux_transcript"),
		languageId: char("language_id", { length: 2 })
			.notNull()
			.references(() => language.code),
		thumbnail: text("thumbnail")
			.notNull()
			.generatedAlwaysAs(
				sql`'https://image.mux.com/' || mux_playback_id || '/thumbnail.png'`
			),
		url: text("url")
			.notNull()
			.generatedAlwaysAs(
				sql`'https://stream.mux.com/' || mux_playback_id || '.m3u8'`
			)
	},
	(table) => [
		index("videos_title_idx").on(table.title),
		index("videos_language_id_idx").on(table.languageId)
	]
)

export const videoWord = createTable(
	"video_word",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		videoId: char("video_id", { length: 24 })
			.notNull()
			.references(() => video.id),
		word: text("word").notNull(),
		timeOffset: integer("time_offset").notNull()
	},
	(table) => [
		index("video_word_video_id_idx").on(table.videoId),
		index("video_word_time_offset_idx").on(table.timeOffset)
	]
)

export const userLanguageLevel = createTable(
	"user_language_level",
	{
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		userId: char("user_id", { length: 24 })
			.notNull()
			.references(() => user.id),
		languageId: char("language_id", { length: 2 })
			.notNull()
			.references(() => language.code),
		stars: integer("stars").notNull().default(0),
		level: integer("level")
			.notNull()
			.generatedAlwaysAs(sql`FLOOR(SQRT(stars / 10.0) + 1)::integer`)
	},
	(table) => [
		index("user_language_levels_user_id_idx").on(table.userId),
		primaryKey({ columns: [table.userId, table.languageId] })
	]
)

export const chatRole = pgEnum("chat_role", ["user", "ai"])

export const chatMessage = createTable(
	"chat_message",
	{
		videoId: char("video_id", { length: 24 })
			.notNull()
			.references(() => video.id),
		userId: char("user_id", { length: 24 })
			.notNull()
			.references(() => user.id),
		role: chatRole("role").notNull(),
		text: text("text").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date())
	},
	(table) => [primaryKey({ columns: [table.videoId, table.userId] })]
)

export const userInterest = createTable(
	"user_interest",
	{
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$default(() => new Date()),
		userId: char("user_id", { length: 24 })
			.notNull()
			.references(() => user.id),
		subInterestId: char("sub_interest_id", { length: 24 })
			.notNull()
			.references(() => subInterest.id)
	},
	(table) => [
		index("user_interests_user_id_idx").on(table.userId),
		primaryKey({ columns: [table.userId, table.subInterestId] })
	]
)

export const userInterestRelations = relations(userInterest, ({ one }) => ({
	user: one(user, {
		fields: [userInterest.userId],
		references: [user.id]
	}),
	subInterest: one(subInterest, {
		fields: [userInterest.subInterestId],
		references: [subInterest.id]
	})
}))

export const challengesRelations = relations(challenge, ({ many }) => ({
	peers: many(challengePeer),
	userChallenges: many(userChallenge)
}))

export const interestsRelations = relations(interest, ({ many }) => ({
	subInterests: many(subInterest)
}))

export const usersRelations = relations(user, ({ many, one }) => ({
	languageLevels: many(userLanguageLevel),
	userChallenges: many(userChallenge),
	currentLanguage: one(language, {
		fields: [user.currentLanguageId],
		references: [language.code]
	}),
	interests: many(userInterest)
}))

export const languagesRelations = relations(language, ({ many }) => ({
	userLanguageLevels: many(userLanguageLevel),
	videos: many(video)
}))

export const userChallengesRelations = relations(
	userChallenge,
	({ one, many }) => ({
		user: one(user, {
			fields: [userChallenge.userId],
			references: [user.id]
		}),
		challenge: one(challenge, {
			fields: [userChallenge.challengeId],
			references: [challenge.id]
		}),
		words: many(userChallengeWord)
	})
)

export const userChallengeWordsRelations = relations(
	userChallengeWord,
	({ one }) => ({
		userChallenge: one(userChallenge, {
			fields: [userChallengeWord.userChallengeId],
			references: [userChallenge.id]
		})
	})
)

export const videosRelations = relations(video, ({ one }) => ({
	language: one(language, {
		fields: [video.languageId],
		references: [language.code]
	})
}))

export const challengePeerRelations = relations(challengePeer, ({ one }) => ({
	challenge: one(challenge, {
		fields: [challengePeer.challengeId],
		references: [challenge.id]
	})
}))

export const subInterestRelations = relations(subInterest, ({ one }) => ({
	interest: one(interest, {
		fields: [subInterest.interestId],
		references: [interest.id]
	})
}))

export const userLanguageLevelRelations = relations(
	userLanguageLevel,
	({ one }) => ({
		language: one(language, {
			fields: [userLanguageLevel.languageId],
			references: [language.code]
		}),
		user: one(user, {
			fields: [userLanguageLevel.userId],
			references: [user.id]
		})
	})
)

export const playbackEventType = pgEnum("playback_event_type", [
	"playerready",
	"viewinit",
	"videochange",
	"play",
	"playing",
	"pause",
	"timeupdate",
	"seeking",
	"seeked",
	"ended",
	"viewend",
	"error"
])

export const videoPlaybackEvent = createTable(
	"video_playback_event",
	{
		id: char("id", { length: 24 }).notNull().$default(createId),
		sessionId: char("session_id", { length: 24 }).notNull(),
		videoId: char("video_id", { length: 24 })
			.notNull()
			.references(() => video.id),
		userId: char("user_id", { length: 24 })
			.notNull()
			.references(() => user.id),
		eventTime: timestamp("event_time", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		viewerTime: timestamp("viewer_time", { mode: "date" }),
		eventType: playbackEventType("event_type").notNull(),
		playbackPosition: integer("playback_position").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		primaryKey({ columns: [table.id, table.eventTime] }),
		index("video_playback_event_user_id_idx").on(table.userId),
		index("video_playback_event_video_id_idx").on(table.videoId)
	]
)

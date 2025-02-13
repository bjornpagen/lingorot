import { createId } from "@paralleldrive/cuid2"
import {
	char,
	pgTableCreator,
	timestamp,
	text,
	integer,
	real,
	boolean,
	index,
	pgEnum,
	check,
	primaryKey,
	date,
	uniqueIndex
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { relations } from "drizzle-orm"

export const createTable = pgTableCreator((name) => `lingorot_${name}`)

export const languageCode = pgEnum("language_code", [
	"ar", // Arabic
	"zh", // Chinese
	"en", // English
	"fr", // French
	"ru", // Russian
	"es" // Spanish
])

export const user = createTable(
	"user",
	{
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
		currentLanguageId: languageCode("current_language_id")
			.references(() => language.code)
			.notNull()
			.default("en")
	},
	(table) => [
		uniqueIndex("user_email_idx").on(table.email),
		check("user_id_length", sql`length(${table.id}) = 24`)
	]
)

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}))

export const session = createTable(
	"session",
	{
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
	},
	(table) => [
		index("session_user_id_idx").on(table.userId),
		check("session_id_length", sql`length(${table.id}) = 24`)
	]
)

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}))

export const account = createTable(
	"account",
	{
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
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		check("account_id_length", sql`length(${table.id}) = 24`)
	]
)

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	})
}))

export const verification = createTable(
	"verification",
	{
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
	},
	(table) => [check("verification_id_length", sql`length(${table.id}) = 24`)]
)

// END OF BETTERAUTH TABLES

export const difficulty = pgEnum("difficulty", [
	"beginner",
	"intermediate",
	"advanced"
])

export const expiryType = pgEnum("expiry_type", ["claims", "date"])

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

export const playbackEventType = pgEnum("playback_event_type", [
	"viewinit",
	"viewend",
	"statusChange",
	"error",
	"play",
	"pause",
	"playbackRateChange",
	"volumeChange",
	"mutedChange",
	"ended",
	"timeUpdate",
	"sourceChange"
])

export const cefrLevel = pgEnum("cefr_level", [
	"A1",
	"A2",
	"B1",
	"B2",
	"C1",
	"C2"
])

export const language = createTable(
	"language",
	{
		code: languageCode("code").primaryKey().notNull(),
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
		check("challenge_id_length", sql`length(${table.id}) = 24`),
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
		index("user_challenges_challenge_id_idx").on(table.challengeId),
		check("user_challenge_id_length", sql`length(${table.id}) = 24`)
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
		index("user_challenge_word_user_challenge_id_idx").on(
			table.userChallengeId
		),
		check("user_challenge_word_id_length", sql`length(${table.id}) = 24`)
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
	(table) => [
		index("challenge_peers_challenge_id_idx").on(table.challengeId),
		check("challenge_peer_id_length", sql`length(${table.id}) = 24`)
	]
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
	(table) => [
		uniqueIndex("interest_name_idx").on(table.name),
		check("interest_id_length", sql`length(${table.id}) = 24`)
	]
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
	(table) => [
		uniqueIndex("sub_interest_name_idx").on(table.interestId, table.name),
		check("sub_interest_id_length", sql`length(${table.id}) = 24`)
	]
)

export const book = createTable(
	"book",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		gutenbergId: integer("gutenberg_id").unique().notNull(),
		title: text("title").notNull(),
		author: text("author").notNull(),
		languageId: languageCode("language_id")
			.notNull()
			.references(() => language.code),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index("book_gutenberg_id_idx").on(table.gutenbergId),
		index("book_language_id_idx").on(table.languageId),
		check("book_id_length", sql`length(${table.id}) = 24`)
	]
)

export const bookSection = createTable(
	"book_section",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		bookId: char("book_id", { length: 24 })
			.notNull()
			.references(() => book.id),
		name: text("name").notNull(),
		position: integer("position").notNull(),
		content: text("content").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex("book_section_book_position_idx").on(
			table.bookId,
			table.position
		),
		check("book_section_id_length", sql`length(${table.id}) = 24`)
	]
)

export const bookSectionTranslation = createTable(
	"book_section_translation",
	{
		sectionId: char("section_id", { length: 24 })
			.notNull()
			.references(() => bookSection.id, { onDelete: "cascade" }),
		languageId: languageCode("language_id")
			.notNull()
			.references(() => language.code),
		content: text("content").notNull(),
		cefrLevel: cefrLevel("cefr_level").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.sectionId, table.languageId, table.cefrLevel]
		}),
		sectionLanguageIdx: index("section_language_idx").on(
			table.sectionId,
			table.languageId
		)
	})
)

export const bookRelations = relations(book, ({ one, many }) => ({
	language: one(language, {
		fields: [book.languageId],
		references: [language.code]
	}),
	sections: many(bookSection)
}))

export const bookSectionRelations = relations(bookSection, ({ one, many }) => ({
	book: one(book, {
		fields: [bookSection.bookId],
		references: [book.id]
	}),
	translations: many(bookSectionTranslation)
}))

export const bookSectionTranslationRelations = relations(
	bookSectionTranslation,
	({ one }) => ({
		section: one(bookSection, {
			fields: [bookSectionTranslation.sectionId],
			references: [bookSection.id]
		}),
		language: one(language, {
			fields: [bookSectionTranslation.languageId],
			references: [language.code]
		})
	})
)

export const file = createTable(
	"file",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		name: text("name").notNull(),
		size: integer("size").notNull(),
		type: text("type").notNull()
	},
	(table) => [check("file_id_length", sql`length(${table.id}) = 24`)]
)

export const video = createTable(
	"video",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		bookSectionId: char("book_section_id", { length: 24 })
			.notNull()
			.references(() => bookSection.id),
		languageId: languageCode("language_id")
			.notNull()
			.references(() => language.code),
		cefrLevel: cefrLevel("cefr_level").notNull(),
		fileId: char("file_id", { length: 24 }).references(() => file.id),
		muxAssetId: text("mux_asset_id"),
		muxPlaybackId: text("mux_playback_id"),
		muxTranscript: text("mux_transcript"),
		subtitleGeneratedAt: timestamp("subtitle_generated_at", { mode: "date" }),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		uniqueIndex("video_variant_idx").on(
			table.bookSectionId,
			table.languageId,
			table.cefrLevel
		),
		check("video_id_length", sql`length(${table.id}) = 24`)
	]
)

export const videoRelations = relations(video, ({ one }) => ({
	translation: one(bookSectionTranslation, {
		fields: [video.bookSectionId, video.languageId, video.cefrLevel],
		references: [
			bookSectionTranslation.sectionId,
			bookSectionTranslation.languageId,
			bookSectionTranslation.cefrLevel
		]
	}),
	language: one(language, {
		fields: [video.languageId],
		references: [language.code]
	}),
	file: one(file, {
		fields: [video.fileId],
		references: [file.id]
	})
}))

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
		uniqueIndex("video_word_occurrence_idx").on(
			table.videoId,
			table.word,
			table.timeOffset
		),
		check("video_word_id_length", sql`length(${table.id}) = 24`)
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
		languageId: languageCode("language_id")
			.notNull()
			.references(() => language.code),
		stars: integer("stars").notNull().default(0),
		level: integer("level")
			.notNull()
			.generatedAlwaysAs(
				sql`CASE WHEN stars < 1 THEN 1 ELSE FLOOR(POWER(stars::float8 / 28, 0.808)) + 1 END::integer`
			)
	},
	(table) => [
		index("user_language_levels_user_id_idx").on(table.userId),
		primaryKey({ columns: [table.userId, table.languageId] })
	]
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
	videos: many(video),
	books: many(book),
	translations: many(bookSectionTranslation)
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
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date()),
		playbackPosition: real("playback_position"),
		bufferedPosition: real("buffered_position"),
		currentLiveTimestamp: real("current_live_timestamp"),
		currentOffsetFromLive: real("current_offset_from_live"),
		status: text("status"),
		oldStatus: text("old_status"),
		error: text("error"),
		playbackRate: real("playback_rate"),
		oldPlaybackRate: real("old_playback_rate"),
		volume: real("volume"),
		oldVolume: real("old_volume"),
		muted: boolean("muted"),
		oldMuted: boolean("old_muted"),
		source: text("source"),
		oldSource: text("old_source")
	},
	(table) => [
		primaryKey({ columns: [table.id, table.eventTime] }),
		index("video_playback_event_user_id_idx").on(table.userId),
		index("video_playback_event_video_id_idx").on(table.videoId),
		index("video_playback_event_session_id_idx").on(table.sessionId),
		check("video_playback_event_id_length", sql`length(${table.id}) = 24`),
		check(
			"chk_playback_position",
			sql`(
				(event_type = 'timeUpdate' AND playback_position IS NOT NULL)
				OR (event_type <> 'timeUpdate' AND playback_position IS NULL)
			)`
		),
		check(
			"chk_buffered_position",
			sql`(
				(event_type = 'timeUpdate' AND buffered_position IS NOT NULL)
				OR (event_type <> 'timeUpdate' AND buffered_position IS NULL)
			)`
		),
		check(
			"chk_current_live_timestamp",
			sql`(
				event_type = 'timeUpdate' OR current_live_timestamp IS NULL
			)`
		),
		check(
			"chk_current_offset_from_live",
			sql`(
				event_type = 'timeUpdate' OR current_offset_from_live IS NULL
			)`
		),
		check(
			"chk_status",
			sql`(
				(event_type = 'statusChange' AND status IS NOT NULL)
				OR (event_type <> 'statusChange' AND status IS NULL)
			)`
		),
		check(
			"chk_old_status",
			sql`(
				event_type = 'statusChange' OR old_status IS NULL
			)`
		),
		check(
			"chk_error",
			sql`(
				(event_type = 'error' AND error IS NOT NULL)
				OR (event_type <> 'error' AND error IS NULL)
			)`
		),
		check(
			"chk_playback_rate",
			sql`(
				(event_type = 'playbackRateChange' AND playback_rate IS NOT NULL)
				OR (event_type <> 'playbackRateChange' AND playback_rate IS NULL)
			)`
		),
		check(
			"chk_old_playback_rate",
			sql`(
				(event_type = 'playbackRateChange' AND old_playback_rate IS NOT NULL)
				OR (event_type <> 'playbackRateChange' AND old_playback_rate IS NULL)
			)`
		),
		check(
			"chk_volume",
			sql`(
				(event_type = 'volumeChange' AND volume IS NOT NULL)
				OR (event_type <> 'volumeChange' AND volume IS NULL)
			)`
		),
		check(
			"chk_old_volume",
			sql`(
				(event_type = 'volumeChange' AND old_volume IS NOT NULL)
				OR (event_type <> 'volumeChange' AND old_volume IS NULL)
			)`
		),
		check(
			"chk_muted",
			sql`(
				(event_type = 'mutedChange' AND muted IS NOT NULL)
				OR (event_type <> 'mutedChange' AND muted IS NULL)
			)`
		),
		check(
			"chk_old_muted",
			sql`(
				event_type = 'mutedChange' OR old_muted IS NULL
			)`
		),
		check(
			"chk_source",
			sql`(
				(event_type = 'sourceChange' AND source IS NOT NULL)
				OR (event_type <> 'sourceChange' AND source IS NULL)
			)`
		),
		check(
			"chk_old_source",
			sql`(
				event_type = 'sourceChange' OR old_source IS NULL
			)`
		)
	]
)

export const sectionFrame = createTable(
	"section_frame",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		bookSectionId: char("book_section_id", { length: 24 })
			.notNull()
			.references(() => bookSection.id),
		fileId: char("file_id", { length: 24 })
			.notNull()
			.references(() => file.id),
		displayPercentage: real("display_percentage").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index("section_frame_section_idx").on(table.bookSectionId),
		index("section_frame_file_idx").on(table.fileId),
		check("section_frame_id_length", sql`length(${table.id}) = 24`),
		check(
			"display_percentage_range",
			sql`(${table.displayPercentage} >= 0 AND ${table.displayPercentage} <= 1)`
		)
	]
)

export const sectionAudio = createTable(
	"section_audio",
	{
		id: char("id", { length: 24 }).primaryKey().notNull().$default(createId),
		bookSectionId: char("book_section_id", { length: 24 })
			.notNull()
			.references(() => bookSection.id),
		fileId: char("file_id", { length: 24 })
			.notNull()
			.references(() => file.id),
		durationMs: integer("duration_ms").notNull(),
		position: integer("position").notNull(),
		createdAt: timestamp("created_at", { mode: "date" })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index("section_audio_section_idx").on(table.bookSectionId),
		index("section_audio_file_idx").on(table.fileId),
		uniqueIndex("section_audio_position_idx").on(
			table.bookSectionId,
			table.position
		),
		check("section_audio_id_length", sql`length(${table.id}) = 24`)
	]
)

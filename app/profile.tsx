import React from "react"
import { Text } from "react-native"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"
import PageLayout from "@/components/PageLayout"
import ProfileContent from "@/components/ProfileContent"
import { getSession } from "@/lib/session"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "@/components/Redirect"

const styles = {
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#333",
		marginBottom: 4
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		lineHeight: 20
	}
} as const

async function updateUserLanguage(code: string) {
	"use server"

	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	await db.transaction(async (tx) => {
		await tx
			.update(schema.user)
			.set({ currentLanguageId: code })
			.where(eq(schema.user.id, session.user.id))

		await tx
			.insert(schema.userLanguageLevel)
			.values({
				userId: session.user.id,
				languageId: code,
				stars: 0
			})
			.onConflictDoNothing()
	})
}

const getProfile = async (userId: string) => {
	const profile = await db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			avatarUrl: schema.user.image,
			bio: schema.user.bio,
			challengesCompleted: schema.user.challengesCompleted,
			wordsLearned: schema.user.wordsLearned,
			daysStreak: schema.user.daysStreak,
			minutesWatched: schema.user.minutesWatched,
			currentLanguageCode: schema.language.code,
			stars: sql<number>`COALESCE(sum(${schema.userLanguageLevel.stars}), 0)`
		})
		.from(schema.user)
		.innerJoin(
			schema.language,
			eq(schema.user.currentLanguageId, schema.language.code)
		)
		.leftJoin(
			schema.userLanguageLevel,
			and(
				eq(schema.user.id, schema.userLanguageLevel.userId),
				eq(schema.userLanguageLevel.languageId, schema.language.code)
			)
		)
		.where(eq(schema.user.id, userId))
		.groupBy(
			schema.user.id,
			schema.user.name,
			schema.user.image,
			schema.user.bio,
			schema.user.challengesCompleted,
			schema.user.wordsLearned,
			schema.user.daysStreak,
			schema.user.minutesWatched,
			schema.language.code
		)
		.then((rows) => rows[0])

	if (!profile) {
		throw new Error("Profile not found")
	}

	return profile
}

const getLanguageLevels = async (userId: string) => {
	return db
		.select({
			code: schema.language.code,
			name: schema.language.name,
			level: sql<number>`COALESCE(${schema.userLanguageLevel.level}, 1)`,
			emoji: schema.language.emoji
		})
		.from(schema.language)
		.leftJoin(
			schema.userLanguageLevel,
			and(
				eq(schema.userLanguageLevel.languageId, schema.language.code),
				eq(schema.userLanguageLevel.userId, userId)
			)
		)
}

export type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>
export type LanguageLevel = Awaited<
	ReturnType<typeof getLanguageLevels>
>[number]

async function ProfileData() {
	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	const [profile, languageLevels] = await Promise.all([
		getProfile(session.user.id),
		getLanguageLevels(session.user.id)
	])

	if (!profile) {
		throw new Error("Profile not found")
	}

	return (
		<ProfileContent
			profile={profile}
			languageLevels={languageLevels}
			onLanguageChange={updateUserLanguage}
		/>
	)
}

export default async function ProfilePage() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	const header = (
		<React.Fragment>
			<Text style={styles.title}>Your Profile</Text>
			<Text style={styles.subtitle}>
				Track your progress and manage your learning journey
			</Text>
		</React.Fragment>
	)

	return (
		<PageLayout header={header}>
			<React.Suspense fallback={<PageSpinner />}>
				{/* @ts-expect-error: experimental server component*/}
				<ProfileData />
			</React.Suspense>
		</PageLayout>
	)
}

import React from "react"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"
import SheetLayout from "@/components/SheetLayout"
import LeaderboardEntryDetails from "@/components/LeaderboardEntryDetails"
import { getSession } from "@/lib/session"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "expo-router"

const getLeaderboardEntry = async (userId: string, id: string) => {
	const userQuery = db
		.select({
			id: schema.user.id,
			currentLanguageId: schema.user.currentLanguageId
		})
		.from(schema.user)
		.where(eq(schema.user.id, userId))
		.limit(1)

	const user = await userQuery
	if (!user[0]) {
		throw new Error("User not found")
	}

	return db
		.select({
			id: schema.user.id,
			name: schema.user.name,
			avatarUrl: schema.user.image,
			stars: schema.userLanguageLevel.stars,
			currentLanguage: {
				emoji: schema.language.emoji,
				level: schema.userLanguageLevel.level
			},
			stats: {
				challengesCompleted: schema.user.challengesCompleted,
				wordsLearned: schema.user.wordsLearned,
				daysStreak: schema.user.daysStreak,
				minutesWatched: schema.user.minutesWatched
			}
		})
		.from(schema.user)
		.innerJoin(
			schema.userLanguageLevel,
			and(
				eq(schema.user.id, schema.userLanguageLevel.userId),
				eq(schema.user.currentLanguageId, schema.userLanguageLevel.languageId)
			)
		)
		.innerJoin(
			schema.language,
			eq(schema.userLanguageLevel.languageId, schema.language.id)
		)
		.where(eq(schema.user.id, id))
		.limit(1)
		.then((rows) => rows[0])
}

export type LeaderboardEntry = NonNullable<
	Awaited<ReturnType<typeof getLeaderboardEntry>>
>

async function LeaderboardEntryData({ id }: { id: string }) {
	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	const entry = await getLeaderboardEntry(session.user.id, id)
	if (!entry) {
		throw new Error("Leaderboard entry not found")
	}

	return <LeaderboardEntryDetails details={entry} />
}

export default async function LeaderboardEntryPage({ id }: { id: string }) {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	return (
		<SheetLayout backRoute="/leaderboard">
			<React.Suspense fallback={<PageSpinner />}>
				{/* @ts-expect-error: experimental server component*/}
				<LeaderboardEntryData id={id} />
			</React.Suspense>
		</SheetLayout>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5"
	}
} as const

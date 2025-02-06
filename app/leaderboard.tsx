import React from "react"
import { Text } from "react-native"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql, and, desc } from "drizzle-orm"
import PageLayout from "@/components/PageLayout"
import LeaderboardList from "@/components/LeaderboardContent"
import { getSession } from "@/lib/session"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "@/components/Redirect"

const getLeaderboard = async (userId: string) => {
	const currentUser = await db
		.select({
			currentLanguageId: schema.user.currentLanguageId
		})
		.from(schema.user)
		.where(eq(schema.user.id, userId))
		.limit(1)
		.then((rows) => rows[0])

	if (!currentUser) {
		throw new Error("User not found")
	}
	if (!currentUser.currentLanguageId) {
		return []
	}

	return db
		.select({
			id: schema.user.id,
			rank: sql<number>`row_number() over (order by ${schema.userLanguageLevel.stars} desc)`,
			name: schema.user.name,
			avatarUrl: schema.user.image,
			stars: schema.userLanguageLevel.stars,
			streak: schema.user.daysStreak,
			currentLanguage: {
				emoji: schema.language.emoji,
				level: schema.userLanguageLevel.level
			}
		})
		.from(schema.user)
		.innerJoin(
			schema.userLanguageLevel,
			and(
				eq(schema.user.id, schema.userLanguageLevel.userId),
				eq(schema.userLanguageLevel.languageId, currentUser.currentLanguageId)
			)
		)
		.innerJoin(
			schema.language,
			eq(schema.userLanguageLevel.languageId, schema.language.id)
		)
		.orderBy(desc(schema.userLanguageLevel.stars))
}

export type LeaderboardEntry = Awaited<
	ReturnType<typeof getLeaderboard>
>[number]

async function LeaderboardData() {
	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	const entries = await getLeaderboard(session.user.id)
	if (!entries) {
		throw new Error("Leaderboard entries not found")
	}

	return <LeaderboardList entries={entries} />
}

export default async function LeaderboardPage() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	const header = (
		<React.Fragment>
			<Text style={styles.title}>Leaderboard</Text>
			<Text style={styles.subtitle}>
				See how you rank against other language learners
			</Text>
		</React.Fragment>
	)

	return (
		<PageLayout header={header}>
			<React.Suspense fallback={<PageSpinner />}>
				{/* @ts-expect-error: experimental server component*/}
				<LeaderboardData />
			</React.Suspense>
		</PageLayout>
	)
}

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

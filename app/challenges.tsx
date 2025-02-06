import React from "react"
import { Text } from "react-native"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"
import PageLayout from "@/components/PageLayout"
import ChallengeList from "@/components/ChallengesContent"
import { getSession } from "@/lib/session"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "@/components/Redirect"

async function getChallenges(userId: string) {
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
			id: schema.challenge.id,
			title: schema.challenge.title,
			description: schema.challenge.description,
			points: schema.challenge.points,
			difficulty: schema.challenge.difficulty,
			expiryType: schema.challenge.expiryType,
			expiry: schema.challenge.expiry,
			maxClaims: schema.challenge.maxClaims,
			currentClaims: schema.challenge.currentClaims,
			progress: {
				current: schema.userChallenge.progressCurrent,
				total: schema.challenge.progressTotal
			}
		})
		.from(schema.challenge)
		.leftJoin(
			schema.userChallenge,
			and(
				eq(schema.userChallenge.challengeId, schema.challenge.id),
				eq(schema.userChallenge.userId, user[0].id)
			)
		)
}

export type ChallengeEntry = Awaited<ReturnType<typeof getChallenges>>[number]

async function ChallengeData() {
	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	const challenges = await getChallenges(session.user.id)
	return <ChallengeList challenges={challenges} />
}

export default async function ChallengesPage() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	const header = (
		<React.Fragment>
			<Text style={styles.title}>Language Challenges</Text>
			<Text style={styles.subtitle}>
				Complete challenges to earn points and improve your language skills
			</Text>
		</React.Fragment>
	)

	return (
		<PageLayout header={header}>
			<React.Suspense fallback={<PageSpinner />}>
				{/* @ts-expect-error: experimental server component*/}
				<ChallengeData />
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

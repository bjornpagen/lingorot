import React from "react"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import ChallengeContent from "@/components/ChallengeContent"
import SheetLayout from "@/components/SheetLayout"
import { getSession } from "@/lib/session"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "expo-router"

const getChallengeDetails = async (userId: string, id: string) => {
	const challenge = await db
		.select({
			id: schema.challenge.id,
			title: schema.challenge.title,
			description: schema.challenge.description,
			points: schema.challenge.points,
			expiryType: schema.challenge.expiryType,
			expiry: schema.challenge.expiry,
			maxClaims: schema.challenge.maxClaims,
			currentClaims: schema.challenge.currentClaims,
			progress: {
				current: sql<number>`coalesce(${schema.userChallenge.progressCurrent}, 0)`,
				total: schema.challenge.progressTotal
			}
		})
		.from(schema.challenge)
		.where(eq(schema.challenge.id, id))
		.leftJoin(
			schema.userChallenge,
			and(
				eq(schema.userChallenge.challengeId, schema.challenge.id),
				eq(schema.userChallenge.userId, userId)
			)
		)
		.limit(1)
		.then((rows) => rows[0])

	if (!challenge) {
		throw new Error("Challenge not found")
	}

	const [words, peers] = await Promise.all([
		db
			.select({
				word: schema.userChallengeWord.word,
				dateDiscovered: sql<string>`min(${schema.userChallengeWord.dateDiscovered})`,
				dateLastSeen: sql<string>`max(${schema.userChallengeWord.dateLastSeen})`
			})
			.from(schema.userChallengeWord)
			.innerJoin(
				schema.userChallenge,
				and(
					eq(schema.userChallengeWord.userChallengeId, schema.userChallenge.id),
					eq(schema.userChallenge.challengeId, id)
				)
			)
			.groupBy(schema.userChallengeWord.word),
		db
			.select({
				id: schema.user.id,
				name: schema.user.name,
				avatarUrl: schema.user.image,
				progress: sql<number>`coalesce(${schema.userChallenge.progressCurrent}, 0)`,
				rank: sql<number>`row_number() over (order by ${schema.userChallenge.progressCurrent} desc)`
			})
			.from(schema.userChallenge)
			.where(eq(schema.userChallenge.challengeId, id))
			.innerJoin(schema.user, eq(schema.user.id, schema.userChallenge.userId))
			.orderBy(desc(schema.userChallenge.progressCurrent))
			.limit(50)
	])

	return {
		...challenge,
		wordsLearned: words,
		peers
	}
}

export type ChallengeDetails = NonNullable<
	Awaited<ReturnType<typeof getChallengeDetails>>
>

async function Loaded({ id }: { id: string }) {
	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	const details = await getChallengeDetails(session.user.id, id)
	return <ChallengeContent details={details} />
}

export default async function ChallengeDetailsPage({ id }: { id: string }) {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	return (
		<SheetLayout backRoute="/challenges">
			<React.Suspense fallback={<PageSpinner />}>
				{/* @ts-expect-error: experimental server component*/}
				<Loaded id={id} />
			</React.Suspense>
		</SheetLayout>
	)
}

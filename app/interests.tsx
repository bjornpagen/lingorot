import React from "react"
import { Text } from "react-native"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import PageLayout from "@/components/PageLayout"
import InterestContent from "@/components/InterestContent"
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

async function toggleUserInterest(subInterestId: string) {
	"use server"

	const session = await getSession()
	if (!session) {
		throw new Error("Session not found")
	}

	const existing = await db
		.select()
		.from(schema.userInterest)
		.where(
			sql`${schema.userInterest.userId} = ${session.user.id} AND ${schema.userInterest.subInterestId} = ${subInterestId}`
		)
		.limit(1)
		.then((rows) => rows[0])

	if (existing) {
		await db
			.delete(schema.userInterest)
			.where(
				sql`${schema.userInterest.userId} = ${session.user.id} AND ${schema.userInterest.subInterestId} = ${subInterestId}`
			)
	} else {
		await db.insert(schema.userInterest).values({
			userId: session.user.id,
			subInterestId
		})
	}
}

const getInterests = async (userId: string) => {
	const userQuery = db
		.select({
			id: schema.user.id
		})
		.from(schema.user)
		.where(eq(schema.user.id, userId))
		.limit(1)

	const user = await userQuery
	if (!user[0]) {
		throw new Error("User not found")
	}

	const interests = await db
		.select({
			id: schema.interest.id,
			name: schema.interest.name,
			subInterests: sql<
				Array<{
					id: string
					name: string
					selected: boolean
				}>
			>`json_agg(json_build_object(
				'id', ${schema.subInterest.id},
				'name', ${schema.subInterest.name},
				'selected', (${schema.userInterest.userId} IS NOT NULL)
			))`
		})
		.from(schema.interest)
		.innerJoin(
			schema.subInterest,
			eq(schema.interest.id, schema.subInterest.interestId)
		)
		.leftJoin(
			schema.userInterest,
			sql`${schema.userInterest.subInterestId} = ${schema.subInterest.id} AND ${schema.userInterest.userId} = ${userId}`
		)
		.groupBy(schema.interest.id, schema.interest.name)

	return interests
}

export type Interest = NonNullable<
	Awaited<ReturnType<typeof getInterests>>
>[number]

async function InterestData() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	const interests = await getInterests(session.user.id)
	return (
		<InterestContent
			interests={interests}
			onToggleInterest={toggleUserInterest}
		/>
	)
}

export default async function InterestsPage() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	const header = (
		<React.Fragment>
			<Text style={styles.title}>Your Interests</Text>
			<Text style={styles.subtitle}>
				Choose topics you'd like to learn about to personalize your experience
			</Text>
		</React.Fragment>
	)

	return (
		<PageLayout header={header}>
			<React.Suspense fallback={<PageSpinner />}>
				{/* @ts-expect-error: experimental server component*/}
				<InterestData />
			</React.Suspense>
		</PageLayout>
	)
}

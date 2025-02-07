import * as React from "react"
import { View } from "react-native"
import VideoFeed from "@/components/VideoFeed"
import BottomTabBar from "@/components/BottomTabBar"
import { getSession } from "@/lib/session"
import { db } from "@/db"
import * as schema from "@/db/schema"
import { eq } from "drizzle-orm"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "@/components/Redirect"

async function getVideos(userId: string) {
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

	const videos = await db
		.select({
			id: schema.video.id,
			title: schema.video.title,
			description: schema.video.description,
			url: schema.video.url,
			thumbnail: schema.video.thumbnail
		})
		.from(schema.video)
		.where(eq(schema.video.languageId, user[0].currentLanguageId))

	return videos
}

export type Video = Awaited<ReturnType<typeof getVideos>>[number]

async function VideoFeedData() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}
	const languageId = session.user.currentLanguageId
	const videos = await getVideos(session.user.id)
	return <VideoFeed videos={videos} languageId={languageId} />
}

// Home page - displays the main video feed for language learning content
export default async function HomePage() {
	return (
		<View style={styles.container}>
			<View style={styles.feedContainer}>
				<React.Suspense fallback={<PageSpinner />}>
					{/* @ts-expect-error: experimental server component*/}
					<VideoFeedData />
				</React.Suspense>
			</View>
			<BottomTabBar />
		</View>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: "#000"
	},
	feedContainer: {
		flex: 1
	}
} as const

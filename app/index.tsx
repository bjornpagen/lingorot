import * as React from "react"
import { View } from "react-native"
import VideoFeed from "@/components/VideoFeed"
import BottomTabBar from "@/components/BottomTabBar"
import { getSession } from "@/lib/session"
import { getPaginatedVideos } from "@/functions/videoPreloader"
import PageSpinner from "@/components/PageSpinner"
import { Redirect } from "@/components/Redirect"

async function VideoFeedData() {
	const session = await getSession()
	if (!session) {
		return <Redirect href="/signin" />
	}

	const initialVideos = await getPaginatedVideos(
		1,
		5,
		session.user.currentLanguageId
	)
	return (
		<VideoFeed
			videos={initialVideos}
			languageId={session.user.currentLanguageId}
		/>
	)
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

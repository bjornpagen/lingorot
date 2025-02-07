"use client"

import * as React from "react"
import { View, Text, Dimensions, FlatList } from "react-native"
import { useVideoPlayer, VideoView } from "expo-video"
import { ChatButton } from "./ChatButton"
import { ChatModal } from "./ChatModal"
import { theme } from "@/lib/theme"
import {
	getPaginatedVideos,
	type PaginatedVideo
} from "@/functions/videoPreloader"
import type { ViewToken } from "react-native"

const { width, height } = Dimensions.get("window")
const TAB_BAR_HEIGHT = 70
const screenHeight = height - TAB_BAR_HEIGHT

const VideoCard = ({
	title,
	description,
	url,
	thumbnail,
	isActive
}: PaginatedVideo & { isActive: boolean }) => {
	const player = useVideoPlayer(url, (player) => {
		player.loop = true
		player.muted = true
		// TODO: actually use this value in a meaningful way
		// player.posterUrl = thumbnail
	})

	React.useEffect(() => {
		if (player) {
			if (isActive) {
				player.play()
			} else {
				player.pause()
			}
		}
	}, [isActive, player])

	return (
		<React.Fragment>
			<View style={[styles.card, { height: screenHeight }]}>
				<VideoView
					style={styles.video}
					player={player}
					allowsFullscreen
					allowsPictureInPicture
					nativeControls={false}
				/>
				<View style={styles.titleContainer}>
					<View style={styles.contentBubble}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>
				</View>
			</View>
		</React.Fragment>
	)
}

interface VideoFeedProps {
	videos: PaginatedVideo[]
	languageId: string
}

export default function VideoFeed({
	videos: initialVideos,
	languageId
}: VideoFeedProps) {
	const [videos, setVideos] = React.useState(initialVideos)
	const flatListRef = React.useRef<FlatList<PaginatedVideo>>(null)
	const [isChatVisible, setIsChatVisible] = React.useState(false)
	const [currentVideoIndex, setCurrentVideoIndex] = React.useState(0)
	const [page, setPage] = React.useState(1)
	const [loadingMore, setLoadingMore] = React.useState(false)
	const [hasMore, setHasMore] = React.useState(true)

	const viewabilityConfig = React.useMemo(
		() => ({ viewAreaCoveragePercentThreshold: 25 }),
		[]
	)
	const onViewableItemsChanged = React.useCallback(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			const newIndex = viewableItems?.[0]?.index
			newIndex != null && setCurrentVideoIndex(newIndex)
		},
		[]
	)

	async function loadMoreVideos() {
		if (loadingMore || !hasMore) {
			return
		}
		setLoadingMore(true)
		const nextPage = page + 1
		const newVideos = await getPaginatedVideos(nextPage, 5, languageId)
		if (newVideos.length < 5) {
			setHasMore(false)
		}
		setVideos((prev) => [...prev, ...newVideos])
		setPage(nextPage)
		setLoadingMore(false)
	}

	return (
		<React.Fragment>
			<View style={styles.container}>
				<FlatList
					ref={flatListRef}
					data={videos}
					renderItem={({ item, index }) => (
						<VideoCard {...item} isActive={index === currentVideoIndex} />
					)}
					keyExtractor={(item) => item.id}
					pagingEnabled
					snapToInterval={screenHeight}
					snapToAlignment="start"
					decelerationRate={0.1}
					showsVerticalScrollIndicator={false}
					scrollEventThrottle={16}
					removeClippedSubviews
					maxToRenderPerBatch={3}
					windowSize={5}
					bounces={false}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={viewabilityConfig}
					onEndReached={loadMoreVideos}
					onEndReachedThreshold={0.1}
				/>

				<View style={styles.chatButtonContainer}>
					<ChatButton onPress={() => setIsChatVisible(true)} />
				</View>

				<ChatModal
					visible={isChatVisible}
					onClose={() => setIsChatVisible(false)}
					videoTitle={videos[currentVideoIndex]?.title}
				/>
			</View>
		</React.Fragment>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: "#000"
	},
	card: {
		width: width,
		backgroundColor: "#000",
		position: "relative"
	},
	video: {
		width: "100%",
		height: "100%",
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0
	},
	titleContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		padding: 0,
		paddingBottom: 0,
		paddingLeft: 0
	},
	contentBubble: {
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		maxWidth: "65%",
		marginLeft: 0,
		...theme.shadows.sm
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.background,
		marginBottom: theme.spacing.xs,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: -1, height: 1 },
		textShadowRadius: 10
	},
	description: {
		fontSize: 14,
		color: theme.colors.background,
		lineHeight: 20,
		textShadowColor: "rgba(0, 0, 0, 0.75)",
		textShadowOffset: { width: -1, height: 1 },
		textShadowRadius: 10
	},
	loaderContainer: {
		width: width,
		height: height,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#000"
	},
	chatButtonContainer: {
		position: "absolute",
		bottom: 0,
		right: 0,
		zIndex: 1000
	}
} as const

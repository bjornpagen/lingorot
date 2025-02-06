import { View, Text, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "@/lib/theme"
import type { ChallengeDetails } from "@/app/challenges/[id]"
import { formatDeadline, formatParticipants, formatDate } from "@/lib/format"

interface ChallengeContentProps {
	details: ChallengeDetails
}

export default function ChallengeContent({ details }: ChallengeContentProps) {
	const expiryText =
		details.expiryType === "date" && details.expiry
			? formatDeadline(details.expiry.toISOString())
			: formatParticipants(details.currentClaims, details.maxClaims)

	return (
		<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
			<View style={styles.header}>
				<Text style={styles.title}>{details.title}</Text>
				<View style={styles.points}>
					<Ionicons name="star" size={16} color={theme.colors.accent} />
					<Text style={styles.pointsText}>{details.points}</Text>
				</View>
			</View>

			<Text style={styles.description}>{details.description}</Text>
			<View style={styles.expiryContainer}>
				<Ionicons
					name={
						details.expiryType === "date" ? "time-outline" : "people-outline"
					}
					size={18}
					color={theme.colors.text.secondary}
				/>
				<Text style={styles.expiryText}>{expiryText}</Text>
			</View>

			<View>
				<Text style={styles.sectionTitle}>Words Learned</Text>
				<View style={styles.wordsContainer}>
					{details.wordsLearned.length === 0 ? (
						<Text style={styles.emptyText}>
							No words learned yet. Watch videos to discover new words!
						</Text>
					) : (
						details.wordsLearned.map((word) => (
							<View key={word.word} style={styles.wordItem}>
								<Ionicons
									name="checkmark-circle"
									size={20}
									color={theme.colors.states.success}
								/>
								<View style={styles.wordDetails}>
									<Text style={styles.wordText}>{word.word}</Text>
									<Text style={styles.wordDate}>
										Discovered {formatDate(word.dateDiscovered)}
									</Text>
								</View>
							</View>
						))
					)}
				</View>
			</View>

			<View>
				<Text style={styles.sectionTitle}>Peer Progress</Text>
				{details.peers.map((peer) => (
					<View key={peer.id} style={styles.peerContainer}>
						<Text style={styles.rank}>#{peer.rank}</Text>
						<View>
							{peer.progress === 100 && (
								<View style={styles.sparkles}>
									<Ionicons
										name="star"
										size={14}
										color={theme.colors.accent}
										style={styles.sparkleLeft}
									/>
									<Ionicons
										name="star"
										size={16}
										color={theme.colors.accent}
										style={styles.sparkleMiddle}
									/>
									<Ionicons
										name="star"
										size={14}
										color={theme.colors.accent}
										style={styles.sparkleRight}
									/>
								</View>
							)}
							<Image source={{ uri: peer.avatarUrl }} style={styles.avatar} />
						</View>
						<View style={styles.details}>
							<View style={styles.nameRow}>
								<Text style={styles.name}>{peer.name}</Text>
							</View>
							<View style={styles.progressContainer}>
								<View style={styles.progressBar}>
									<View
										style={[
											styles.progressFill,
											peer.progress === 100 && styles.progressFillCompleted,
											{ width: `${peer.progress}%` }
										]}
									/>
								</View>
								<Text style={styles.progressText}>{peer.progress}%</Text>
							</View>
						</View>
					</View>
				))}
			</View>
		</ScrollView>
	)
}

const styles = {
	container: {
		flex: 1,
		padding: theme.spacing.md
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: theme.spacing.md
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.text.primary,
		flex: 1,
		marginRight: theme.spacing.md
	},
	points: {
		flexDirection: "row",
		alignItems: "center"
	},
	pointsText: {
		marginLeft: theme.spacing.xs,
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.text.primary
	},
	description: {
		fontSize: 16,
		color: theme.colors.text.secondary,
		marginBottom: theme.spacing.lg,
		lineHeight: 24
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.md
	},
	wordsContainer: {
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.lg,
		...theme.shadows.sm
	},
	wordItem: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: theme.spacing.md
	},
	wordDetails: {
		flex: 1,
		marginLeft: theme.spacing.md
	},
	wordText: {
		fontSize: 16,
		color: theme.colors.text.primary,
		fontWeight: "500"
	},
	wordDate: {
		fontSize: 12,
		color: theme.colors.text.secondary,
		marginTop: theme.spacing.xs
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.text.secondary,
		fontStyle: "italic",
		textAlign: "center",
		padding: theme.spacing.md
	},
	peerContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.sm
	},
	rank: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.text.secondary,
		width: 40
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: theme.borderRadius.full,
		marginRight: theme.spacing.md
	},
	avatarFallback: {
		width: 48,
		height: 48,
		borderRadius: theme.borderRadius.full,
		backgroundColor: theme.colors.primary,
		justifyContent: "center",
		alignItems: "center",
		marginRight: theme.spacing.md
	},
	avatarText: {
		color: theme.colors.background,
		fontSize: 20,
		fontWeight: "600"
	},
	details: {
		flex: 1
	},
	name: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.xs
	},
	progressContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1
	},
	progressBar: {
		flex: 1,
		height: 6,
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.sm,
		marginRight: theme.spacing.sm
	},
	progressFill: {
		height: "100%",
		backgroundColor: theme.colors.secondary,
		borderRadius: theme.borderRadius.sm
	},
	progressText: {
		fontSize: 14,
		color: theme.colors.text.secondary,
		width: 45
	},
	expiryContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		padding: theme.spacing.md,
		borderRadius: theme.borderRadius.sm,
		marginBottom: theme.spacing.lg
	},
	expiryText: {
		fontSize: 14,
		color: theme.colors.text.secondary,
		marginLeft: theme.spacing.sm
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center"
	},
	progressFillCompleted: {
		backgroundColor: theme.colors.accent
	},
	sparkles: {
		position: "absolute",
		top: -12,
		width: 48,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1
	},
	sparkleLeft: {
		transform: [{ rotate: "-20deg" }],
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.5,
		shadowRadius: 2,
		marginHorizontal: 0
	},
	sparkleRight: {
		transform: [{ rotate: "20deg" }],
		shadowColor: theme.colors.accent,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.5,
		shadowRadius: 2,
		marginHorizontal: 0
	},
	sparkleMiddle: {
		marginTop: -4,
		transform: [{ rotate: "0deg" }],
		marginHorizontal: 0
	}
} as const

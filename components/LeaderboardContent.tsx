"use client"
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { LeaderboardEntry } from "@/app/leaderboard"
import { Link } from "expo-router"
import { formatNumber } from "@/lib/format"
import { theme } from "@/lib/theme"

interface LeaderboardListProps {
	entries: LeaderboardEntry[]
}

export default function LeaderboardContent({ entries }: LeaderboardListProps) {
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			{entries.map((entry) => (
				<Link key={entry.id} href={`/leaderboard/${entry.id}` as const} asChild>
					<TouchableOpacity>
						<View style={styles.entryContainer}>
							<Text style={styles.rank}>#{entry.rank}</Text>
							<View>
								{entry.rank === 1 && (
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
								<Image
									source={{ uri: entry.avatarUrl }}
									style={styles.avatar}
								/>
							</View>
							<View style={styles.details}>
								<Text style={styles.name}>{entry.name}</Text>
								<View style={styles.statsRow}>
									<View style={styles.stat}>
										<Text style={styles.statText}>
											{entry.currentLanguage.emoji} Lvl{" "}
											{entry.currentLanguage.level}
										</Text>
									</View>
									<View style={styles.stat}>
										<Ionicons
											name="star"
											size={14}
											color={theme.colors.accent}
										/>
										<Text style={styles.statText}>
											{formatNumber(entry.stars)}
										</Text>
									</View>
									<View style={styles.stat}>
										<Ionicons
											name="flame"
											size={14}
											color={theme.colors.primary}
										/>
										<Text style={styles.statText}>{entry.streak}d</Text>
									</View>
								</View>
							</View>
						</View>
					</TouchableOpacity>
				</Link>
			))}
		</ScrollView>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: theme.colors.surface
	},
	content: {
		padding: theme.spacing.md,
		paddingBottom: 90
	},
	entryContainer: {
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
	details: {
		flex: 1
	},
	name: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.xs
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center"
	},
	stat: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: theme.spacing.md
	},
	statText: {
		marginLeft: theme.spacing.xs,
		fontSize: 14,
		color: theme.colors.text.secondary
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

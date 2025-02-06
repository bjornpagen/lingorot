"use client"
import { View, Text, Image, ScrollView } from "react-native"
import type { LeaderboardEntry } from "@/app/leaderboard/[id]"
import StatsGrid from "./StatsGrid"
import StatsDisplay from "./StatsDisplay"
import { formatNumber } from "@/lib/format"
import { theme } from "@/lib/theme"

interface DetailsProps {
	details: LeaderboardEntry
}

export default function Details({ details }: DetailsProps) {
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.header}>
				<Image source={{ uri: details.avatarUrl }} style={styles.avatar} />
				<Text style={styles.name}>{details.name}</Text>
				<StatsDisplay
					stars={formatNumber(details.stars)}
					currentLanguage={details.currentLanguage}
				/>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Statistics</Text>
				<StatsGrid stats={details.stats} />
			</View>
		</ScrollView>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: theme.colors.surface
	},
	content: {
		padding: theme.spacing.md
	},
	header: {
		alignItems: "center",
		marginBottom: theme.spacing.lg
	},
	avatar: {
		width: 120,
		height: 120,
		borderRadius: theme.borderRadius.full,
		marginBottom: theme.spacing.md
	},
	name: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.sm
	},
	section: {
		marginBottom: theme.spacing.lg
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.md
	}
} as const

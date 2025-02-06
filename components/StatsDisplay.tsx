"use client"

import { View, Text } from "react-native"
import { theme } from "@/lib/theme"

interface LanguageLevel {
	emoji: string
	level: string
}

interface StatsDisplayProps {
	stars: string
	currentLanguage: LanguageLevel
}

export default function StatsDisplay({
	stars,
	currentLanguage
}: StatsDisplayProps) {
	return (
		<View style={styles.statsRow}>
			<View style={styles.statItem}>
				<Text style={styles.statValue}>✨ {stars}</Text>
				<Text style={styles.statLabel}>Stars</Text>
			</View>
			<View style={styles.divider} />
			<View style={styles.statItem}>
				<Text style={styles.statValue}>
					{currentLanguage.emoji} {currentLanguage.level}
				</Text>
				<Text style={styles.statLabel}>Level</Text>
			</View>
		</View>
	)
}

const styles = {
	statsRow: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		marginBottom: theme.spacing.sm
	},
	statItem: {
		flex: 1,
		alignItems: "center"
	},
	statValue: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.xs
	},
	statLabel: {
		fontSize: 14,
		color: theme.colors.text.secondary
	},
	divider: {
		width: 1,
		height: "100%",
		backgroundColor: theme.colors.surface,
		marginHorizontal: theme.spacing.sm
	}
} as const

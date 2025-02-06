import { View, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "@/lib/theme"

interface UserStats {
	challengesCompleted: number
	wordsLearned: number
	minutesWatched: number
	daysStreak: number
}

interface StatsGridProps {
	stats: UserStats
}

export default function StatsGrid({ stats }: StatsGridProps) {
	return (
		<View style={styles.statsGrid}>
			<View style={styles.statItem}>
				<Ionicons name="trophy" size={24} color={theme.colors.primary} />
				<Text style={styles.statValue}>{stats.challengesCompleted}</Text>
				<Text style={styles.statLabel}>Challenges</Text>
			</View>

			<View style={styles.statItem}>
				<Ionicons name="book" size={24} color={theme.colors.secondary} />
				<Text style={styles.statValue}>{stats.wordsLearned}</Text>
				<Text style={styles.statLabel}>Words</Text>
			</View>

			<View style={styles.statItem}>
				<Ionicons name="flame" size={24} color={theme.colors.primary} />
				<Text style={styles.statValue}>{stats.daysStreak}</Text>
				<Text style={styles.statLabel}>Day Streak</Text>
			</View>

			<View style={styles.statItem}>
				<Ionicons name="time" size={24} color={theme.colors.secondary} />
				<Text style={styles.statValue}>{stats.minutesWatched}</Text>
				<Text style={styles.statLabel}>Minutes</Text>
			</View>
		</View>
	)
}

const styles = {
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between"
	},
	statItem: {
		width: "48%",
		alignItems: "center",
		backgroundColor: theme.colors.background,
		padding: theme.spacing.md,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.sm
	},
	statValue: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.text.primary,
		marginTop: theme.spacing.sm
	},
	statLabel: {
		fontSize: 14,
		color: theme.colors.text.secondary,
		marginTop: theme.spacing.xs
	}
} as const

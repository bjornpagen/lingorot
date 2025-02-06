import { View, Text } from "react-native"
import StatsGrid from "./StatsGrid"
import { theme } from "@/lib/theme"

interface UserStats {
	challengesCompleted: number
	wordsLearned: number
	minutesWatched: number
	daysStreak: number
}

interface ProfileStatsProps {
	stats: UserStats
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Statistics</Text>
			<StatsGrid stats={stats} />
		</View>
	)
}

const styles = {
	section: {
		marginBottom: theme.spacing.md
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.md
	}
} as const

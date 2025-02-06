import { View, Text, Image } from "react-native"
import type { LanguageLevel } from "@/app/profile"
import StatsDisplay from "./StatsDisplay"
import { formatNumber } from "@/lib/format"
import { theme } from "@/lib/theme"

interface ProfileHeaderProps {
	profile: {
		name: string
		avatarUrl: string
		bio: string
		stars: number
		currentLanguage: LanguageLevel
	}
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
	return (
		<View style={styles.container}>
			<Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
			<Text style={styles.name}>{profile.name}</Text>
			<Text style={styles.bio}>{profile.bio}</Text>
			<StatsDisplay
				stars={formatNumber(profile.stars)}
				currentLanguage={profile.currentLanguage}
			/>
		</View>
	)
}

const styles = {
	container: {
		alignItems: "center",
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.sm
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: theme.borderRadius.full,
		marginBottom: theme.spacing.md
	},
	name: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.sm
	},
	bio: {
		fontSize: 16,
		color: theme.colors.text.secondary,
		textAlign: "center",
		marginBottom: theme.spacing.md
	},
	statsRow: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8
	},
	statItem: {
		flex: 1,
		alignItems: "center"
	},
	statValue: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginBottom: 4
	},
	statLabel: {
		fontSize: 14,
		color: "#666"
	},
	divider: {
		width: 1,
		height: "100%",
		backgroundColor: "#F0F0F0",
		marginHorizontal: 8
	}
} as const

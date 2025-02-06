"use client"

import { View, Text, TouchableOpacity } from "react-native"
import { Link } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "@/lib/theme"

export default function BottomTabBar() {
	return (
		<View style={styles.container}>
			<Link href="/" asChild>
				<TouchableOpacity style={styles.tab}>
					<Ionicons name="home" size={28} color={theme.colors.background} />
					<Text style={styles.tabText}>Home</Text>
				</TouchableOpacity>
			</Link>

			<Link href="/challenges" asChild>
				<TouchableOpacity style={styles.tab}>
					<Ionicons name="trophy" size={28} color={theme.colors.background} />
					<Text style={styles.tabText}>Challenges</Text>
				</TouchableOpacity>
			</Link>

			<Link href="/leaderboard" asChild>
				<TouchableOpacity style={styles.tab}>
					<Ionicons name="podium" size={28} color={theme.colors.background} />
					<Text style={styles.tabText}>Leaderboard</Text>
				</TouchableOpacity>
			</Link>

			<Link href="/interests" asChild>
				<TouchableOpacity style={styles.tab}>
					<Ionicons name="heart" size={28} color={theme.colors.background} />
					<Text style={styles.tabText}>Interests</Text>
				</TouchableOpacity>
			</Link>

			<Link href="/profile" asChild>
				<TouchableOpacity style={styles.tab}>
					<Ionicons name="person" size={28} color={theme.colors.background} />
					<Text style={styles.tabText}>Profile</Text>
				</TouchableOpacity>
			</Link>
		</View>
	)
}

const styles = {
	container: {
		flexDirection: "row" as const,
		height: 70,
		backgroundColor: theme.colors.primary,
		position: "absolute" as const,
		bottom: 0,
		left: 0,
		right: 0,
		borderTopLeftRadius: theme.borderRadius.md,
		borderTopRightRadius: theme.borderRadius.md,
		paddingBottom: 8,
		...theme.shadows.md
	},
	tab: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		paddingVertical: 8
	},
	tabText: {
		fontSize: 12,
		fontWeight: "600" as const,
		color: theme.colors.background,
		marginTop: 4
	}
}

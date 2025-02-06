import type React from "react"
import { View, Pressable } from "react-native"
import { Link } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "@/lib/theme"

type SheetLayoutProps = {
	children: React.ReactNode
	backRoute: Parameters<typeof Link>[0]["href"]
}

export default function SheetLayout({ children, backRoute }: SheetLayoutProps) {
	return (
		<View style={styles.container}>
			<View style={styles.safeAreaTop} />
			<View style={styles.safeAreaContent}>{children}</View>
			<Link href={backRoute} asChild>
				<Pressable style={styles.backButton}>
					<Ionicons
						name="arrow-back"
						size={24}
						color={theme.colors.background}
					/>
				</Pressable>
			</Link>
		</View>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: theme.colors.surface
	},
	safeAreaTop: {
		paddingTop: 47
	},
	safeAreaContent: {
		flex: 1,
		paddingBottom: 34
	},
	backButton: {
		position: "absolute",
		bottom: 50,
		right: 20,
		width: 50,
		height: 50,
		borderRadius: theme.borderRadius.full,
		backgroundColor: theme.colors.primary,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		...theme.shadows.md
	}
} as const

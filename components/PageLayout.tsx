import type React from "react"
import { View } from "react-native"
import BottomTabBar from "@/components/BottomTabBar"
import { theme } from "@/lib/theme"

type PageLayoutProps = {
	children: React.ReactNode
	header: React.ReactNode
}

export default function PageLayout({ children, header }: PageLayoutProps) {
	return (
		<View style={styles.container}>
			<View style={styles.topContainer}>
				<View style={styles.safeAreaTop}>
					<View style={styles.header}>{header}</View>
				</View>
			</View>
			<View style={styles.safeAreaContent}>{children}</View>
			<View style={styles.bottomTabContainer}>
				<BottomTabBar />
			</View>
		</View>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: theme.colors.surface
	},
	topContainer: {
		backgroundColor: theme.colors.background,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.surface
	},
	safeAreaTop: {
		paddingTop: 47
	},
	safeAreaContent: {
		flex: 1,
		paddingBottom: 34
	},
	bottomTabContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingBottom: 34
	},
	header: {
		padding: theme.spacing.md
	}
} as const

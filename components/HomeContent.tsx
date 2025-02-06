"use client"

import { Text, View } from "react-native"

const styles = {
	container: {
		flex: 1,
		justifyContent: "center" as const,
		alignItems: "center" as const,
		gap: 12,
		maxWidth: "100%" as const,
		padding: 16
	},
	headerText: {
		...(process.env.EXPO_OS === "web"
			? { whiteSpace: "pre-wrap" as const }
			: {}),
		fontFamily: "monospace",
		maxWidth: 800
	},
	signInButton: {
		backgroundColor: "#007AFF",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8
	},
	signUpButton: {
		backgroundColor: "#0056b3",
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600" as const
	}
}

type HomeContentProps = {
	headers: string
}

export function HomeContent({ headers }: HomeContentProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.headerText}>Page Headers:\n{headers}</Text>
		</View>
	)
}

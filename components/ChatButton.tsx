import { TouchableOpacity, View, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface ChatButtonProps {
	onPress: () => void
}

export function ChatButton({ onPress }: ChatButtonProps) {
	return (
		<TouchableOpacity
			onPress={onPress}
			style={styles.button}
			activeOpacity={0.7}
		>
			<View style={styles.iconContainer}>
				<Ionicons name="happy-outline" size={32} color="white" />
				<Text style={styles.text}>Chat!</Text>
			</View>
		</TouchableOpacity>
	)
}

const styles = {
	button: {
		position: "absolute",
		right: 16,
		bottom: 90,
		zIndex: 1000
	},
	iconContainer: {
		width: 100,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#FF6B6B", // Friendly, warm color
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		paddingHorizontal: 12
	},
	text: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
		marginLeft: 6
	}
} as const

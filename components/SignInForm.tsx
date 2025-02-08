"use client"

import * as React from "react"
import { View, TextInput, Text, Pressable } from "react-native"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "expo-router"
import { theme } from "@/lib/theme"
import { Svg, Path, Circle } from "react-native-svg"

const RobotMascot = () => (
	<Svg width={120} height={120} viewBox="0 0 200 200" fill="none">
		<Circle
			cx={100}
			cy={100}
			r={90}
			fill={theme.colors.primary}
			opacity={0.1}
		/>
		<Path d="M60 80h80v60H60z" fill={theme.colors.primary} />
		<Circle cx={80} cy={100} r={10} fill={theme.colors.background} />
		<Circle cx={120} cy={100} r={10} fill={theme.colors.background} />
		<Path
			d="M85 120h30"
			stroke={theme.colors.background}
			strokeWidth={6}
			strokeLinecap="round"
		/>
		<Path d="M70 60h60v20H70z" fill={theme.colors.primary} />
		<Circle cx={85} cy={40} r={8} fill={theme.colors.primary} />
		<Circle cx={115} cy={40} r={8} fill={theme.colors.primary} />
		<Path d="M50 110h-10v20h10M150 110h10v20h-10" fill={theme.colors.primary} />
	</Svg>
)

const styles = {
	container: {
		width: "100%" as const,
		maxWidth: 400,
		padding: theme.spacing.md,
		gap: theme.spacing.md,
		alignItems: "center" as const
	},
	mascotContainer: {
		marginBottom: theme.spacing.md,
		alignItems: "center" as const
	},
	mascot: {
		width: 120,
		height: 120,
		marginBottom: theme.spacing.sm
	},
	title: {
		fontSize: 28,
		fontWeight: "700" as const,
		color: theme.colors.primary,
		marginBottom: theme.spacing.xs
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.text.secondary,
		marginBottom: theme.spacing.lg
	},
	input: {
		backgroundColor: theme.colors.background,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.md,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		borderColor: theme.colors.surface,
		fontSize: 16,
		color: theme.colors.text.primary,
		width: "100%",
		...theme.shadows.sm
	},
	button: {
		backgroundColor: theme.colors.primary,
		paddingVertical: theme.spacing.md,
		paddingHorizontal: theme.spacing.lg,
		borderRadius: theme.borderRadius.sm,
		alignItems: "center" as const,
		width: "100%",
		...theme.shadows.sm
	},
	buttonText: {
		color: theme.colors.background,
		fontSize: 16,
		fontWeight: "600" as const
	},
	linkButton: {
		alignItems: "center" as const,
		paddingVertical: theme.spacing.sm
	},
	linkText: {
		color: theme.colors.text.secondary,
		fontSize: 14
	}
} as const

export default function SignInForm() {
	const [email, setEmail] = React.useState("")
	const [password, setPassword] = React.useState("")
	const router = useRouter()

	const handleLogin = async () => {
		const res = await authClient.signIn.email({
			email,
			password
		})
		if (res.error) {
			console.error(res.error)
		} else {
			router.replace("/")
		}
	}

	return (
		<View style={styles.container}>
			<View style={styles.mascotContainer}>
				<RobotMascot />
				<Text style={styles.title}>Lingorot</Text>
				<Text style={styles.subtitle}>Learn languages through videos</Text>
			</View>
			<TextInput
				style={styles.input}
				keyboardType="email-address"
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				placeholderTextColor={theme.colors.text.secondary}
				autoCapitalize="none"
				autoCorrect={false}
				spellCheck={false}
			/>
			<TextInput
				style={styles.input}
				placeholder="Password"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				placeholderTextColor={theme.colors.text.secondary}
				onSubmitEditing={handleLogin}
				returnKeyType="go"
			/>
			<Pressable style={styles.button} onPress={handleLogin}>
				<Text style={styles.buttonText}>Sign In</Text>
			</Pressable>
			<Pressable
				style={styles.linkButton}
				onPress={() => router.push("/signup")}
			>
				<Text style={styles.linkText}>Need an account? Sign up</Text>
			</Pressable>
		</View>
	)
}

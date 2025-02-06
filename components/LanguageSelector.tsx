"use client"

import { View, Text, TouchableOpacity } from "react-native"
import type { LanguageLevel } from "@/app/profile"
import { useState } from "react"
import { theme } from "@/lib/theme"

interface LanguageSelectorProps {
	currentLanguage: string
	languageLevels: LanguageLevel[]
	onLanguageChange: (code: string) => Promise<void>
}

export default function LanguageSelector({
	currentLanguage: initialLanguage,
	languageLevels,
	onLanguageChange
}: LanguageSelectorProps) {
	// Local state to handle immediate UI updates
	const [currentLanguage, setCurrentLanguage] = useState(initialLanguage)
	const [isChanging, setIsChanging] = useState(false)

	const handleLanguageChange = async (code: string) => {
		if (isChanging || code === currentLanguage) {
			return
		}

		try {
			setIsChanging(true)
			await onLanguageChange(code)
			setCurrentLanguage(code)
		} catch (error) {
			console.error("Failed to change language:", error)
			// You might want to show an error message to the user here
		} finally {
			setIsChanging(false)
		}
	}

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Learning Language</Text>
			<View style={styles.languageGrid}>
				{languageLevels.map((lang) => (
					<TouchableOpacity
						key={lang.code}
						style={[
							styles.languageButton,
							currentLanguage === lang.code && styles.selectedLanguage,
							isChanging && styles.disabledButton
						]}
						onPress={() => handleLanguageChange(lang.code)}
						disabled={isChanging}
					>
						<Text style={styles.languageEmoji}>{lang.emoji}</Text>
						<Text
							style={[
								styles.languageName,
								currentLanguage === lang.code && styles.selectedLanguageText
							]}
						>
							{lang.name}
						</Text>
						<View style={styles.levelBadge}>
							<Text style={styles.levelText}>Lvl {lang.level}</Text>
						</View>
					</TouchableOpacity>
				))}
			</View>
		</View>
	)
}

const styles = {
	container: {
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.md,
		padding: theme.spacing.md,
		marginVertical: theme.spacing.sm,
		...theme.shadows.sm
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.md
	},
	languageGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.spacing.sm
	},
	languageButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surface,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		borderColor: theme.colors.surface,
		minWidth: "48%",
		flex: 1,
		gap: theme.spacing.sm
	},
	selectedLanguage: {
		backgroundColor: `${theme.colors.primary}10`,
		borderColor: theme.colors.primary
	},
	languageEmoji: {
		fontSize: 20,
		width: 26
	},
	languageName: {
		fontSize: 14,
		color: theme.colors.text.secondary,
		flexShrink: 1,
		flexGrow: 0
	},
	selectedLanguageText: {
		color: theme.colors.primary,
		fontWeight: "500"
	},
	levelBadge: {
		backgroundColor: theme.colors.surface,
		paddingHorizontal: theme.spacing.xs,
		paddingVertical: theme.spacing.xs / 2,
		borderRadius: theme.borderRadius.sm
	},
	levelText: {
		fontSize: 12,
		color: theme.colors.text.secondary,
		fontWeight: "500"
	},
	disabledButton: {
		opacity: 0.6
	}
} as const

"use client"

import React from "react"
import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import type { Interest } from "@/app/interests"
import { theme } from "@/lib/theme"

interface InterestContentProps {
	interests: Interest[]
	onToggleInterest: (interestId: string) => Promise<void>
}

export default function InterestContent({
	interests,
	onToggleInterest
}: InterestContentProps) {
	const [selectedSubInterests, setSelectedSubInterests] = React.useState<
		Map<string, Set<string>>
	>(
		new Map(
			interests.map((category) => [
				category.id,
				new Set(
					category.subInterests
						.filter((sub) => sub.selected)
						.map((sub) => sub.id)
				)
			])
		)
	)

	const toggleSubInterest = (categoryId: string, subInterestId: string) => {
		const updateSelection = (prev: Map<string, Set<string>>) => {
			const next = new Map(prev)
			const categorySet = new Set(next.get(categoryId))
			categorySet.has(subInterestId)
				? categorySet.delete(subInterestId)
				: categorySet.add(subInterestId)
			next.set(categoryId, categorySet)
			return next
		}

		setSelectedSubInterests(updateSelection)
		onToggleInterest(subInterestId).catch(() =>
			setSelectedSubInterests(updateSelection)
		)
	}

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			{interests.map((category) => (
				<View key={category.id} style={styles.card}>
					<View style={styles.categorySection}>
						<Text style={styles.categoryHeader}>{category.name}</Text>
						<View style={styles.pillsContainer}>
							{category.subInterests.map((subInterest) => {
								const isSelected = selectedSubInterests
									.get(category.id)
									?.has(subInterest.id)
								return (
									<TouchableOpacity
										key={subInterest.id}
										style={[styles.pill, isSelected && styles.selectedPill]}
										onPress={() =>
											toggleSubInterest(category.id, subInterest.id)
										}
									>
										<Text
											style={[
												styles.pillText,
												isSelected && styles.selectedPillText
											]}
										>
											{subInterest.name}
										</Text>
									</TouchableOpacity>
								)
							})}
						</View>
					</View>
				</View>
			))}
		</ScrollView>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: theme.colors.surface
	},
	content: {
		padding: theme.spacing.md,
		paddingBottom: 90
	},
	card: {
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius.md,
		marginBottom: theme.spacing.md,
		...theme.shadows.sm
	},
	categorySection: {
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.md
	},
	categoryHeader: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.text.primary,
		marginBottom: theme.spacing.md
	},
	pillsContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginHorizontal: -theme.spacing.xs
	},
	pill: {
		backgroundColor: theme.colors.surface,
		borderRadius: theme.borderRadius.full,
		paddingHorizontal: theme.spacing.md,
		paddingVertical: theme.spacing.sm,
		margin: theme.spacing.xs,
		minHeight: 36,
		justifyContent: "center",
		alignItems: "center"
	},
	selectedPill: {
		backgroundColor: theme.colors.primary
	},
	pillText: {
		fontSize: 14,
		color: theme.colors.text.secondary,
		fontWeight: "500",
		textAlignVertical: "center"
	},
	selectedPillText: {
		color: theme.colors.background,
		fontWeight: "500"
	}
} as const

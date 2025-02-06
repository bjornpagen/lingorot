"use client"

import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Link } from "expo-router"
import type { ChallengeEntry } from "@/app/challenges"
import { formatTimeLeft } from "@/lib/format"

interface ChallengesContentProps {
	challenges: ChallengeEntry[]
}

function ExpiryInfo({ challenge }: { challenge: ChallengeEntry }) {
	if (challenge.expiryType === "date" && challenge.expiry) {
		const now = Date.now()
		const timeLeft = challenge.expiry.getTime() - now
		const isUrgent = timeLeft <= 60 * 60 * 1000 // Less than 1 hour
		const color = isUrgent ? "#E53E3E" : "#666" // Muted red

		return (
			<View style={styles.stat}>
				<Ionicons name="time" size={14} color={color} />
				<Text style={[styles.statText, { color }]}>
					{formatTimeLeft(challenge.expiry)}
				</Text>
			</View>
		)
	}

	if (challenge.expiryType === "claims" && challenge.maxClaims) {
		const spotsLeft = challenge.maxClaims - challenge.currentClaims
		const isUrgent = spotsLeft <= 3
		const color = isUrgent ? "#E53E3E" : "#666" // Same muted red

		return (
			<View style={styles.stat}>
				<Ionicons name="people" size={14} color={color} />
				<Text style={[styles.statText, { color }]}>{spotsLeft} spots left</Text>
			</View>
		)
	}

	return null
}

export default function ChallengesContent({
	challenges
}: ChallengesContentProps) {
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			{challenges.map((challenge) => (
				<Link
					key={challenge.id}
					href={`/challenges/${challenge.id}` as const}
					asChild
				>
					<TouchableOpacity>
						<View style={styles.card}>
							<View style={styles.cardContent}>
								<Text style={styles.title}>{challenge.title}</Text>
								<Text style={styles.description}>{challenge.description}</Text>
								<View style={styles.statsRow}>
									<View style={styles.stat}>
										<Ionicons name="star" size={14} color="#FFD700" />
										<Text style={styles.statText}>
											{challenge.points} points
										</Text>
									</View>
									<ExpiryInfo challenge={challenge} />
									<View style={styles.difficultyBadge}>
										<Text style={styles.difficultyText}>
											{challenge.difficulty}
										</Text>
									</View>
								</View>
							</View>
						</View>
					</TouchableOpacity>
				</Link>
			))}
		</ScrollView>
	)
}

const styles = {
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5"
	},
	content: {
		padding: 16,
		paddingBottom: 90 // Account for bottom tab bar
	},
	card: {
		backgroundColor: "white",
		borderRadius: 12,
		marginBottom: 16,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2
	},
	cardContent: {
		padding: 16
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginBottom: 4
	},
	description: {
		fontSize: 14,
		color: "#666",
		marginBottom: 12,
		lineHeight: 20
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center"
	},
	stat: {
		flexDirection: "row",
		alignItems: "center",
		marginRight: 12
	},
	statText: {
		marginLeft: 4,
		fontSize: 14,
		color: "#666"
	},
	difficultyBadge: {
		backgroundColor: "#6B4EFF",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12
	},
	difficultyText: {
		color: "white",
		fontSize: 12,
		fontWeight: "600"
	}
} as const

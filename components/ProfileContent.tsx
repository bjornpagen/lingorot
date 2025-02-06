"use client"

import { ScrollView } from "react-native"
import ProfileHeader from "@/components/ProfileHeader"
import ProfileStats from "@/components/ProfileStats"
import LanguageSelector from "@/components/LanguageSelector"
import LogoutButton from "@/components/LogoutButton"
import type { Profile, LanguageLevel } from "@/app/profile"
import React from "react"

interface ProfileContentProps {
	profile: Profile
	languageLevels: LanguageLevel[]
	onLanguageChange: (code: string) => Promise<void>
}

export default function ProfileContent({
	profile,
	languageLevels,
	onLanguageChange
}: ProfileContentProps) {
	const [currentLanguageCode, setCurrentLanguageCode] = React.useState(
		profile.currentLanguageCode
	)

	const currentLangDetails = languageLevels.find(
		(lang) => lang.code === currentLanguageCode
	)
	if (!currentLangDetails) {
		throw new Error("Current language details not found")
	}

	const handleLanguageChange = async (code: string) => {
		try {
			await onLanguageChange(code)
			setCurrentLanguageCode(code)
		} catch (error) {
			console.error("Failed to change language:", error)
		}
	}

	return (
		<ScrollView
			style={styles.content}
			contentContainerStyle={styles.contentContainer}
			showsVerticalScrollIndicator={false}
		>
			<ProfileHeader
				profile={{
					name: profile.name,
					avatarUrl:
						profile.avatarUrl ??
						`https://ui-avatars.com/api/?background=random&seed=${profile.id}`,
					bio: profile.bio,
					stars: profile.stars,
					currentLanguage: currentLangDetails
				}}
			/>
			<LanguageSelector
				currentLanguage={currentLanguageCode}
				languageLevels={languageLevels}
				onLanguageChange={handleLanguageChange}
			/>
			<ProfileStats
				stats={{
					challengesCompleted: profile.challengesCompleted,
					wordsLearned: profile.wordsLearned,
					daysStreak: profile.daysStreak,
					minutesWatched: profile.minutesWatched
				}}
			/>
			<LogoutButton />
		</ScrollView>
	)
}

const styles = {
	content: {
		flex: 1
	},
	contentContainer: {
		padding: 16,
		paddingBottom: 80,
		gap: 24
	}
} as const

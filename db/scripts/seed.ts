import "dotenv/config"
import { faker } from "@faker-js/faker"
import { db } from "@/db"
import * as schema from "@/db/schema"

type InsertChallenge = typeof schema.challenge.$inferInsert

const BATCH_SIZE = 1000

function chunkify<T>(array: T[]): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < array.length; i += BATCH_SIZE) {
		chunks.push(array.slice(i, i + BATCH_SIZE))
	}
	return chunks
}

async function seed() {
	console.log("Starting seed...")
	await db.delete(schema.chatMessage)
	await db.delete(schema.videoWord)
	await db.delete(schema.userChallengeWord)
	await db.delete(schema.challengePeer)
	await db.delete(schema.userChallenge)
	await db.delete(schema.userLanguageLevel)
	await db.delete(schema.userInterest)
	await db.delete(schema.challenge)
	await db.delete(schema.video)
	await db.delete(schema.subInterest)
	await db.delete(schema.interest)
	await db.delete(schema.verification)
	await db.delete(schema.session)
	await db.delete(schema.account)
	await db.delete(schema.user)
	await db.delete(schema.language)
	const languagesData = [
		{ code: "en", name: "English", emoji: "🇬🇧" },
		{ code: "es", name: "Spanish", emoji: "🇪🇸" },
		{ code: "fr", name: "French", emoji: "🇫🇷" },
		{ code: "ar", name: "Arabic", emoji: "🇸🇦" },
		{ code: "zh", name: "Chinese", emoji: "🇨🇳" },
		{ code: "ru", name: "Russian", emoji: "🇷🇺" }
	]
	const languageResults = await db
		.insert(schema.language)
		.values(languagesData)
		.returning({ code: schema.language.code })

	const languageCodes = languageResults.map((l) => l.code)
	const interestsData = [
		{
			name: "Entertainment",
			subInterests: [
				"Movies",
				"TV Shows",
				"Gaming",
				"Anime",
				"Comics",
				"Books",
				"Theater",
				"Stand-up Comedy",
				"Reality TV",
				"Web Series"
			]
		},
		{
			name: "Music",
			subInterests: [
				"Pop",
				"Hip Hop",
				"Rock",
				"Classical",
				"Jazz",
				"Electronic",
				"K-pop",
				"Latin",
				"R&B",
				"Folk",
				"Musical Instruments",
				"Music Production"
			]
		},
		{
			name: "Food & Drink",
			subInterests: [
				"Cooking",
				"Baking",
				"Restaurant Reviews",
				"Street Food",
				"Wine",
				"Coffee",
				"Cocktails",
				"Healthy Eating",
				"Vegetarian",
				"International Cuisine",
				"Food Science",
				"Recipe Development"
			]
		},
		{
			name: "Sports & Fitness",
			subInterests: [
				"Soccer",
				"Basketball",
				"Tennis",
				"Yoga",
				"Running",
				"Gym",
				"Swimming",
				"Martial Arts",
				"Cycling",
				"Hiking",
				"Dance",
				"Extreme Sports"
			]
		},
		{
			name: "Technology",
			subInterests: [
				"Programming",
				"AI",
				"Gadgets",
				"Smartphones",
				"Gaming Tech",
				"Cybersecurity",
				"Web Development",
				"Robotics",
				"Virtual Reality",
				"Tech News"
			]
		},
		{
			name: "Education",
			subInterests: [
				"Language Learning",
				"History",
				"Science",
				"Mathematics",
				"Literature",
				"Philosophy",
				"Psychology",
				"Art History",
				"Economics",
				"Politics"
			]
		},
		{
			name: "Arts & Crafts",
			subInterests: [
				"Drawing",
				"Painting",
				"Photography",
				"Digital Art",
				"Sculpture",
				"Pottery",
				"DIY",
				"Knitting",
				"Fashion Design",
				"Jewelry Making"
			]
		},
		{
			name: "Travel & Culture",
			subInterests: [
				"Adventure Travel",
				"Budget Travel",
				"Luxury Travel",
				"Cultural Experiences",
				"Food Tourism",
				"Historical Sites",
				"Local Customs",
				"Travel Photography",
				"Digital Nomad",
				"Sustainable Travel"
			]
		},
		{
			name: "Lifestyle",
			subInterests: [
				"Fashion",
				"Beauty",
				"Home Decor",
				"Minimalism",
				"Sustainability",
				"Personal Development",
				"Productivity",
				"Mental Health",
				"Relationships",
				"Wellness"
			]
		},
		{
			name: "Business",
			subInterests: [
				"Entrepreneurship",
				"Marketing",
				"Finance",
				"Startups",
				"Career Development",
				"Leadership",
				"Digital Marketing",
				"E-commerce",
				"Personal Finance",
				"Investing"
			]
		},
		{
			name: "Nature & Science",
			subInterests: [
				"Animals",
				"Plants",
				"Space",
				"Climate Change",
				"Biology",
				"Physics",
				"Chemistry",
				"Astronomy",
				"Environmental Science",
				"Weather"
			]
		},
		{
			name: "Social Issues",
			subInterests: [
				"Human Rights",
				"Environmental Justice",
				"Gender Equality",
				"Education Access",
				"Healthcare",
				"Social Innovation",
				"Cultural Diversity",
				"Community Development"
			]
		}
	]
	const insertedInterests = await db
		.insert(schema.interest)
		.values(interestsData.map(({ name }) => ({ name })))
		.returning({ id: schema.interest.id, name: schema.interest.name })
	const subInterestsData = insertedInterests.flatMap((interest) => {
		const category = interestsData.find(
			(c) => c.name === interest.name
		) as (typeof interestsData)[0]
		return category.subInterests.map((name) => ({
			interestId: interest.id,
			name,
			selected: false
		}))
	})
	for (const chunk of chunkify(subInterestsData)) {
		await db.insert(schema.subInterest).values(chunk)
	}
	const userCount = 20
	const userRows = Array.from({ length: userCount }, () => {
		const currentLanguageId = faker.helpers.arrayElement(languageCodes)
		return {
			name: faker.person.fullName(),
			email: faker.internet.email(),
			emailVerified: false,
			image: faker.image.avatar(),
			bio: faker.lorem.sentence(),
			challengesCompleted: faker.number.int({ min: 0, max: 100 }),
			wordsLearned: faker.number.int({ min: 0, max: 500 }),
			minutesWatched: faker.number.int({ min: 0, max: 1000 }),
			daysStreak: faker.number.int({ min: 0, max: 30 }),
			currentLanguageId
		}
	})
	const insertedUsers: { id: string }[] = []
	for (const chunk of chunkify(userRows)) {
		const results = await db
			.insert(schema.user)
			.values(chunk)
			.returning({ id: schema.user.id })
		insertedUsers.push(...results)
	}
	const userIds = insertedUsers.map((u) => u.id)
	const userInterestsRows = []
	for (const userId of userIds) {
		const subInterests = await db
			.select({
				id: schema.subInterest.id
			})
			.from(schema.subInterest)

		const selectedSubInterests = faker.helpers.arrayElements(subInterests, 3)

		for (const subInterest of selectedSubInterests) {
			userInterestsRows.push({
				userId,
				subInterestId: subInterest.id
			})
		}
	}

	for (const chunk of chunkify(userInterestsRows)) {
		await db.insert(schema.userInterest).values(chunk)
	}
	const challengeCount = 10
	const difficultyOptions = ["beginner", "intermediate", "advanced"] as const
	const challengeRows: InsertChallenge[] = Array.from(
		{ length: challengeCount },
		() => {
			const expiryType = faker.helpers.arrayElement(["claims", "date"]) as
				| "claims"
				| "date"
			const challenge: InsertChallenge = {
				title: faker.lorem.sentence(),
				description: faker.lorem.paragraph(),
				points: faker.number.int({ min: 10, max: 100 }),
				expiryType,
				progressTotal: faker.number.int({ min: 1, max: 100 }),
				difficulty: faker.helpers.arrayElement(difficultyOptions),
				maxClaims:
					expiryType === "claims"
						? faker.number.int({ min: 1, max: 10 })
						: null,
				expiry: expiryType === "claims" ? null : faker.date.future()
			}
			return challenge
		}
	)
	const insertedChallenges = await db
		.insert(schema.challenge)
		.values(challengeRows)
		.returning({ id: schema.challenge.id })
	const userChallengesRows = []
	for (const userId of userIds) {
		const assignedChallenges = faker.helpers.arrayElements(
			insertedChallenges,
			faker.number.int({ min: 1, max: 3 })
		)
		for (const challenge of assignedChallenges) {
			const progressTotal = faker.number.int({ min: 1, max: 100 })
			userChallengesRows.push({
				userId,
				challengeId: challenge.id,
				progressTotal,
				progressCurrent: faker.number.int({ min: 0, max: progressTotal })
			})
		}
	}
	const insertedUserChallenges: { id: string; userId: string }[] = []
	for (const chunk of chunkify(userChallengesRows)) {
		const results = await db
			.insert(schema.userChallenge)
			.values(chunk)
			.returning({
				id: schema.userChallenge.id,
				userId: schema.userChallenge.userId
			})
		insertedUserChallenges.push(...results)
	}
	const userChallengeWordsRows = []
	for (const uc of insertedUserChallenges) {
		const wordCount = faker.number.int({ min: 1, max: 5 })
		for (let i = 0; i < wordCount; i++) {
			userChallengeWordsRows.push({
				userChallengeId: uc.id,
				word: faker.word.noun(),
				dateDiscovered: faker.date.past(),
				dateLastSeen: faker.helpers.maybe(() => faker.date.recent(), {
					probability: 0.5
				})
			})
		}
	}
	for (const chunk of chunkify(userChallengeWordsRows)) {
		await db.insert(schema.userChallengeWord).values(chunk)
	}
	const challengePeersRows = []
	for (const challenge of insertedChallenges) {
		for (let i = 0; i < 2; i++) {
			challengePeersRows.push({
				challengeId: challenge.id,
				peerId: faker.string.uuid(),
				name: faker.person.fullName(),
				progress: faker.number.int({ min: 0, max: 100 }),
				avatarUrl: faker.image.avatar()
			})
		}
	}
	for (const chunk of chunkify(challengePeersRows)) {
		await db.insert(schema.challengePeer).values(chunk)
	}
	const videoRows = Array.from(languageCodes).flatMap((languageId) => {
		return Array.from({ length: 10 }, () => ({
			title: faker.lorem.sentence(),
			description: faker.lorem.paragraph(),
			muxAssetId: faker.string.uuid(),
			muxPlaybackId: faker.string.uuid(),
			muxTranscript: faker.helpers.maybe(() => faker.lorem.paragraph(), {
				probability: 0.5
			}),
			languageId
		}))
	})
	const insertedVideos = await db
		.insert(schema.video)
		.values(videoRows)
		.returning({ id: schema.video.id })
	const videoWordsRows = []
	for (const video of insertedVideos) {
		for (let i = 0; i < 5; i++) {
			videoWordsRows.push({
				videoId: video.id,
				word: faker.word.noun(),
				timeOffset: faker.number.int({ min: 0, max: 300 })
			})
		}
	}
	for (const chunk of chunkify(videoWordsRows)) {
		await db.insert(schema.videoWord).values(chunk)
	}
	const chatMessagesRows = []
	for (const video of insertedVideos) {
		const selectedUserIds = faker.helpers.arrayElements(userIds, 5)
		for (const userId of selectedUserIds) {
			chatMessagesRows.push({
				videoId: video.id,
				userId,
				role: faker.helpers.arrayElement(["user", "ai"]),
				text: faker.lorem.paragraph(),
				createdAt: faker.date.past()
			})
		}
	}
	for (const chunk of chunkify(chatMessagesRows)) {
		await db.insert(schema.chatMessage).values(chunk)
	}
	const userLanguageLevelsRows = []
	const seenCombinations = new Set<string>()

	for (let i = 0; i < userRows.length; i++) {
		const userId = insertedUsers[i].id
		const currentLanguageId = userRows[i].currentLanguageId

		const key = `${userId}-${currentLanguageId}`
		if (!seenCombinations.has(key)) {
			seenCombinations.add(key)
			userLanguageLevelsRows.push({
				userId,
				languageId: currentLanguageId,
				stars: faker.number.int({ min: 0, max: 5 })
			})
		}

		if (faker.datatype.boolean()) {
			const randomLanguageId = faker.helpers.arrayElement(
				languageCodes.filter((id) => id !== currentLanguageId)
			)
			const randomKey = `${userId}-${randomLanguageId}`
			if (!seenCombinations.has(randomKey)) {
				seenCombinations.add(randomKey)
				userLanguageLevelsRows.push({
					userId,
					languageId: randomLanguageId,
					stars: faker.number.int({ min: 0, max: 5 })
				})
			}
		}
	}

	for (const chunk of chunkify(userLanguageLevelsRows)) {
		await db.insert(schema.userLanguageLevel).values(chunk)
	}
	console.log("Seed completed!")
}

seed().catch((e) => {
	console.error("Error seeding:", e)
	process.exit(1)
})

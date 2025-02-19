"use client"
import {
	Modal,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	KeyboardAvoidingView,
	ScrollView
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { bookChat } from "@/lib/ai/chat"
import type * as schema from "@/db/schema"

interface Message {
	id: string
	text: string
	isUser: boolean
}

interface ChatModalProps {
	visible: boolean
	onClose: () => void
	videoTitle: string
	bookId: string
	sectionId: string
	languageId: (typeof schema.languageCode.enumValues)[number]
}

export function ChatModal({
	visible,
	onClose,
	videoTitle,
	bookId,
	sectionId,
	languageId
}: ChatModalProps) {
	const [message, setMessage] = React.useState("")
	const [messages, setMessages] = React.useState<Message[]>([])
	const [isLoading, setIsLoading] = React.useState(false)

	React.useEffect(() => {
		const initializeChat = async () => {
			setIsLoading(true)
			try {
				const greeting = await bookChat({
					message:
						"Please introduce yourself and ask me if I have any questions about the text.",
					bookId,
					sectionId,
					languageId
				})
				setMessages([
					{
						id: "1",
						text: greeting,
						isUser: false
					}
				])
			} catch (err) {
				setMessages([
					{
						id: "1",
						text: "Hi! 👋 Let's practice together!",
						isUser: false
					}
				])
			} finally {
				setIsLoading(false)
			}
		}

		if (visible) {
			initializeChat()
		}
	}, [visible, bookId, sectionId, languageId])

	const handleSend = async () => {
		if (!message.trim() || isLoading) {
			return
		}

		const userMessage: Message = {
			id: Date.now().toString(),
			text: message,
			isUser: true
		}

		setMessages((prev) => [...prev, userMessage])
		setMessage("")
		setIsLoading(true)

		try {
			const aiResponse = await bookChat({
				message,
				bookId,
				sectionId,
				languageId
			})

			const aiMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: aiResponse,
				isUser: false
			}
			setMessages((prev) => [...prev, aiMessage])
		} catch {
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: "Sorry, I couldn't process your message. Please try again.",
				isUser: false
			}
			setMessages((prev) => [...prev, errorMessage])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Modal
			visible={visible}
			animationType="fade"
			transparent={true}
			onRequestClose={onClose}
		>
			<View style={styles.modalContainer}>
				<View style={styles.modalContent}>
					<View style={styles.header}>
						<Text style={styles.title}>Practice Time! 🌟</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Ionicons name="close-circle" size={32} color="#FF6B6B" />
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.messagesContainer}>
						{messages.map((msg) => (
							<View
								key={msg.id}
								style={[
									styles.messageBubble,
									msg.isUser ? styles.userMessage : styles.aiMessage
								]}
							>
								<Text style={styles.messageText}>{msg.text}</Text>
							</View>
						))}
						{isLoading && (
							<View style={[styles.messageBubble, styles.aiMessage]}>
								<Text style={styles.messageText}>Thinking...</Text>
							</View>
						)}
					</ScrollView>

					<KeyboardAvoidingView
						behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
						style={styles.inputContainer}
					>
						<TextInput
							style={styles.input}
							value={message}
							onChangeText={setMessage}
							placeholder="Type your message..."
							onSubmitEditing={handleSend}
							returnKeyType="send"
							blurOnSubmit={false}
							editable={!isLoading}
							autoCorrect={false}
							autoCapitalize="none"
							spellCheck={false}
						/>
						<TouchableOpacity
							onPress={handleSend}
							style={[
								styles.sendButton,
								isLoading && styles.sendButtonDisabled
							]}
							disabled={isLoading}
						>
							<Ionicons name="send" size={24} color="white" />
						</TouchableOpacity>
					</KeyboardAvoidingView>
				</View>
			</View>
		</Modal>
	)
}

const styles = {
	modalContainer: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)"
	},
	modalContent: {
		flex: 1,
		backgroundColor: "#FFF9F9",
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -3
		},
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 5,
		marginTop: 80,
		paddingBottom: 34
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#FFE4E4"
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#FF6B6B"
	},
	closeButton: {
		padding: 4
	},
	messagesContainer: {
		flex: 1,
		padding: 16
	},
	messageBubble: {
		maxWidth: "80%",
		padding: 16,
		borderRadius: 20,
		marginBottom: 12
	},
	userMessage: {
		backgroundColor: "#FF6B6B",
		alignSelf: "flex-end"
	},
	aiMessage: {
		backgroundColor: "#FFE4E4",
		alignSelf: "flex-start"
	},
	messageText: {
		color: "#333",
		fontSize: 18,
		lineHeight: 24
	},
	inputContainer: {
		flexDirection: "row",
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: "#FFE4E4",
		backgroundColor: "white"
	},
	input: {
		flex: 1,
		backgroundColor: "#FFF9F9",
		borderRadius: 25,
		paddingHorizontal: 20,
		paddingVertical: 12,
		marginRight: 12,
		fontSize: 18,
		color: "#333"
	},
	sendButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#FF6B6B",
		justifyContent: "center",
		alignItems: "center"
	},
	sendButtonDisabled: {
		opacity: 0.5
	}
} as const

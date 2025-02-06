/**
 * Format a date to a readable string
 * @param date Date to format
 * @param options Optional Intl.DateTimeFormatOptions
 */
export function formatDate(
	date: Date | string | number,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric"
	}
): string {
	const d = new Date(date)
	return new Intl.DateTimeFormat(undefined, options).format(d)
}

/**
 * Format a number with thousand separators
 * @param num Number to format
 * @param decimals Number of decimal places (default: 0)
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat().format(num)
}

/**
 * Truncate text with ellipsis if it exceeds maxLength
 * @param text Text to truncate
 * @param maxLength Maximum length before truncating
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text
	}
	return `${text.slice(0, maxLength)}...`
}

/**
 * Convert bytes to human readable size
 * @param bytes Number of bytes
 */
export function formatFileSize(bytes: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"]
	let size = bytes
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex++
	}

	return `${formatNumber(size)} ${units[unitIndex]}`
}

/**
 * Format a time to a readable string based on locale (e.g., "2:30 PM" for en-US or "14:30" for most EU)
 * @param date Date to format
 */
export function formatTime(date: Date): string {
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit"
	}).format(date)
}

/**
 * Format milliseconds into a human readable duration string
 * @param ms Number of milliseconds
 * @param compact If true, only shows largest non-zero unit (e.g., "2h" instead of "2h 30m 15s")
 */
export function formatDuration(ms: number, compact = false): string {
	if (ms === 0) {
		return "0s"
	}

	const units = {
		d: Math.floor(ms / (1000 * 60 * 60 * 24)),
		h: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
		m: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
		s: Math.floor((ms % (1000 * 60)) / 1000)
	}

	const parts = Object.entries(units)
		.filter(([_, value]) => value > 0)
		.map(([unit, value]) => `${value}${unit}`)

	if (compact && parts.length > 0) {
		return parts[0] ?? "0s"
	}

	return parts.join(" ") ?? "0s"
}

export function formatDeadline(deadline: string): string {
	const date = new Date(deadline)
	const now = new Date()
	const diffMs = date.getTime() - now.getTime()
	const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 3600)))

	if (diffHours === 0) {
		return "Challenge expired"
	}

	const dateStr = formatDate(date, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric"
	})

	if (diffHours < 24) {
		return `Ends ${dateStr} (${diffHours}h remaining)`
	}

	const days = Math.floor(diffHours / 24)
	const hours = diffHours % 24

	if (hours === 0) {
		return `Ends ${dateStr} (${days}d remaining)`
	}

	return `Ends ${dateStr} (${days}d ${hours}h remaining)`
}

export function formatParticipants(
	currentClaims: number,
	maxClaims: number | null
): string {
	if (!maxClaims) {
		return "Unlimited spots"
	}
	const spotsLeft = maxClaims - currentClaims
	return `${spotsLeft} spots remaining (${currentClaims}/${maxClaims} joined)`
}

export function formatTimeLeft(deadline: Date): string {
	const now = Date.now()
	const timeLeft = deadline.getTime() - now

	// Convert to relevant units
	const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
	const hours = Math.floor(
		(timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
	)
	const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

	if (timeLeft <= 0) {
		return "Expired"
	}
	if (days > 0) {
		return `${days}d left`
	}
	if (hours > 0) {
		return `${hours}h left`
	}
	return `${Math.max(1, minutes)}m left` // Show at least 1 minute if time is remaining
}

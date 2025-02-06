export const theme = {
	colors: {
		primary: "#FF6B6B",
		secondary: "#4ECDC4",
		accent: "#FFE66D",
		background: "#FFFFFF",
		surface: "#F7F9FC",
		text: {
			primary: "#2D3436",
			secondary: "#636E72"
		},
		states: {
			hover: "#FF8787",
			active: "#FF5252",
			success: "#6BCD9B",
			error: "#FF8A8A"
		}
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 16,
		lg: 24,
		xl: 32
	},
	borderRadius: {
		sm: 8,
		md: 16,
		lg: 24,
		full: 9999
	},
	shadows: {
		sm: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.1,
			shadowRadius: 2,
			elevation: 2
		},
		md: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 3,
			elevation: 3
		}
	}
} as const

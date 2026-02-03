import type { Metadata } from "next"
import React from "react"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { QueryProvider } from "@/components/providers/query-provider"

import { Geist, Geist as V0_Font_Geist, Geist_Mono, Geist_Mono as V0_Font_Geist_Mono,
	Source_Serif_4 as V0_Font_Source_Serif_4 } from "next/font/google"

// Initialize fonts
const geist = V0_Font_Geist({
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	variable: "--font-geist",
})
const geistMono = V0_Font_Geist_Mono({
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
	variable: "--font-geist-mono",
})
const sourceSerif4 = V0_Font_Source_Serif_4({
	subsets: ["latin"],
	weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
	variable: "--font-source-serif-4",
})

export const metadata: Metadata = {
	title: "v0 App",
	description: "Created with v0",
	generator: "v0.app",
	icons: {
		icon: [
			{
				url: "/icon-light-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/icon-dark-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/icon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-icon.png",
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geist.variable} ${geistMono.variable} ${sourceSerif4.variable} font-sans antialiased`}
			>
				<QueryProvider>
					{children}
					<Analytics />
				</QueryProvider>
			</body>
		</html>
	)
}

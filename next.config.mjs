/** @type {import('next').NextConfig} */
const nextConfig = {
	typescript: {
		ignoreBuildErrors: false,
	},
	images: {
		unoptimized: false,
	},
	cacheComponents: true,
	reactCompiler: true,
	experimental: {
		optimizePackageImports: [
			"lucide-react",
			"@radix-ui/react-dialog",
			"@radix-ui/react-label",
			"@radix-ui/react-separator",
			"@radix-ui/react-slot",
		],
	},
	compiler: {
		removeConsole: process.env.NODE_ENV === "production" ?
			{
				exclude: ["error", "warn"],
			} :
			false,
	},
}

export default nextConfig

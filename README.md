# WebGL Shader Component

A high-performance Next.js 16.1.4 application optimized for the Bun runtime, featuring real-time WebGL desert sand shader effects and an AI chat interface.

## Performance Optimizations

- **Bun Runtime**: Optimized for Bun's fast JavaScript runtime and native APIs
- **TanStack Query**: Efficient state management and caching for data fetching
- **React Compiler**: Enabled for automatic memoization and performance gains
- **Turbopack**: Fast bundler with optimized package imports
- **Cache Components**: Next.js 16 cache components for improved rendering performance

## Getting Started

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun dev
```

Configure local model selection (optional):

```bash
export NEXT_PUBLIC_WEBLLM_MODEL="Llama-3.2-1B-Instruct-q4f16_1-MLC"
export NEXT_PUBLIC_WEBLLM_MAX_TOKENS="256" # optional output limiter
```

The first model load downloads weights in-browser and may take a while.
Use a Chromium-based browser with WebGPU enabled for best results.

Build for production:

```bash
bun run build
```

Format code with dprint:

```bash
bun run format
```

## Tech Stack

- **Next.js 16.1.4**: Latest Next.js with React 19.2
- **React 19.2**: Latest React with compiler support
- **Bun**: Fast all-in-one JavaScript runtime
- **TanStack Query**: Powerful async state management
- **TypeScript 5.7**: Strict type-safe TypeScript with ES2024
- **Tailwind CSS 4**: Latest Tailwind with native CSS support
- **WebGL**: Custom shader canvas for real-time graphics
- **dprint**: Fast code formatter

## Architecture

- Minimal dependencies - only essential packages included
- Type-safe with strict TypeScript configuration
- Performance-first with React Compiler and memoization
- Responsive design with mobile-first approach
- Real-time WebGL shader rendering

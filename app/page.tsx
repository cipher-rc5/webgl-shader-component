"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Cpu, Mic } from "lucide-react";
import { DesertSandShader } from "@/components/desert-sand-shader";
import { cn } from "@/lib/utils";
import { Message } from "@/types"; // Import Message type

const CUSTOM_STYLES = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .glass-orb {
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1));
    backdrop-filter: blur(12px);
    box-shadow: 
      inset -10px -10px 20px rgba(0,0,0,0.05),
      inset 10px 10px 20px rgba(255,255,255,0.8),
      0 20px 40px rgba(0,0,0,0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.1);
    border-radius: 20px;
  }
`;

const AI_RESPONSE =
	"I am a local AI agent running directly in your browser. The shader background you see is now a real-time WebGL simulation of desert sand, integrated directly into the React component structure.";

export default function Page(): JSX.Element {
	const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
	const [loadingProgress, setLoadingProgress] = useState<number>(0);
	const [messages, setMessages] = useState<readonly Message[]>([]);
	const [input, setInput] = useState<string>("");
	const [isTyping, setIsTyping] = useState<boolean>(false);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	// Auto-scroll to bottom of chat
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isTyping]);

	// Simulate Model Loading
	const loadModel = (): void => {
		let progress = 0;
		const interval = setInterval(() => {
			progress += Math.floor(Math.random() * 15);
			if (progress >= 100) {
				progress = 100;
				clearInterval(interval);
				setIsModelLoaded(true);
			}
			setLoadingProgress(progress);
		}, 300);
	};

	// Simulate Chat Response
	const handleSend = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		if (!input.trim()) return;

		const userMsg: Message = { role: "user", content: input };
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsTyping(true);

		// Simulated AI delay and streaming effect
		setTimeout(() => {
			let currentText = "";
			const words = AI_RESPONSE.split(" ");
			let wordIndex = 0;

			const typeInterval = setInterval(() => {
				if (wordIndex < words.length) {
					currentText += `${words[wordIndex]} `;
					wordIndex++;
				} else {
					clearInterval(typeInterval);
					setIsTyping(false);
					setMessages((prev) => [
						...prev,
						{ role: "assistant", content: AI_RESPONSE },
					]);
				}
			}, 50);
		}, 600);
	};

	return (
		<div className="flex h-screen w-full overflow-hidden bg-white font-sans text-zinc-900 selection:bg-[#F4D03F]/30">
			<style>{CUSTOM_STYLES}</style>

			{/* Sidebar */}
			<aside className="z-20 flex w-16 flex-col items-center gap-8 border-r border-zinc-100 bg-white/80 py-6 backdrop-blur-sm md:w-20">
				<div className="mb-4 rounded-lg bg-[#121212] p-2">
					<img
						src="/fensory_logo.svg"
						alt="Fensory"
						className="h-6 w-auto md:h-8"
					/>
				</div>
			</aside>

			{/* Main Content */}
			<main className="relative flex flex-1 flex-col bg-white">
				{/* Header */}
				<header className="absolute right-0 top-0 z-30 flex w-full items-center justify-end gap-4 p-4 text-[13px] font-medium text-zinc-500 md:gap-8 md:p-6" />

				{/* Shader Background */}
				<div className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-hidden opacity-50">
					<DesertSandShader
						speed={0.2}
						sandDetail={1.2}
						mistIntensity={1.5}
					/>
					{/* Fade overlay to blend shader into white background at bottom */}
					<div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-white via-white/80 to-transparent" />
				</div>

				{/* Content Area */}
				<div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 pb-8 pt-20 md:justify-center md:pb-16 md:pt-24">
					{/* View: Chat History */}
					{messages.length > 0 ? (
						<div className="custom-scrollbar mb-8 max-h-[65vh] w-full flex-1 space-y-6 overflow-y-auto pr-2 pt-20 md:space-y-8 md:pr-4">
							{messages.map((msg, idx) => (
								<div
									key={idx}
									className={cn(
										"flex w-full",
										msg.role === "user" ? "justify-end" : "justify-start",
									)}
								>
									<div
										className={cn(
											"max-w-[85%] rounded-2xl p-4 text-[15px] leading-relaxed shadow-sm backdrop-blur-sm md:max-w-[80%] md:p-5",
											msg.role === "user"
												? "rounded-tr-sm bg-[#F3F3F3]/90 text-black"
												: "rounded-tl-sm border border-zinc-100 bg-white/80 text-zinc-800 shadow-sm",
										)}
									>
										{msg.content}
									</div>
								</div>
							))}
							{isTyping && (
								<div className="flex w-full justify-start">
									<div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-zinc-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
										<div
											className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
											style={{ animationDelay: "0ms" }}
										/>
										<div
											className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
											style={{ animationDelay: "150ms" }}
										/>
										<div
											className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
											style={{ animationDelay: "300ms" }}
										/>
									</div>
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>
					) : (
						/* View: Empty State (The Orb) */
						<div className="relative mb-12 flex w-full animate-[float_6s_ease-in-out_infinite] flex-col items-center justify-center">
							{/* 3D Orb Structure */}
							<div className="relative flex h-48 w-48 items-center justify-center md:h-64 md:w-64">
								<div className="glass-orb absolute inset-0 animate-[spin-slow_20s_linear_infinite] rounded-full border border-white/60" />
								{/* Inner rings */}
								<div className="absolute h-36 w-36 skew-x-12 rotate-45 rounded-full border-[4px] border-white/30 blur-[1px] md:h-48 md:w-48 md:border-[6px]" />
								<div className="absolute h-40 w-40 -rotate-12 skew-y-6 rounded-full border-[2px] border-white/40 md:h-56 md:w-56" />

								{/* Center Logo */}
								<div className="relative flex h-24 w-24 items-center justify-center rounded-xl bg-[#F4D03F] p-4 drop-shadow-sm md:h-32 md:w-32 md:p-6 bg-foreground">
									<img
										src="/fensory_logo.svg"
										alt="Fensory"
										className="h-auto w-full"
									/>
								</div>
							</div>
						</div>
					)}

					{/* Model Loading / Input Overlay */}
					<div className="relative z-20 w-full max-w-2xl">
						{!isModelLoaded ? (
							<div className="absolute bottom-20 left-1/2 w-full max-w-md -translate-x-1/2 px-4 md:px-0">
								<div className="rounded-3xl border border-white/50 bg-white/60 p-6 text-center shadow-xl backdrop-blur-xl">
									<h3 className="mb-2 text-lg font-semibold">
										Initialize Local Brain
									</h3>
									<p className="mb-4 text-sm text-zinc-500">
										Load the Llama-3 model into your browser's WebGPU engine to
										chat privately.
									</p>

									{loadingProgress > 0 && loadingProgress < 100 ? (
										<div className="w-full space-y-2">
											<div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
												<div
													className="h-full bg-gradient-to-r from-[#F4D03F] to-[#D4AF37] transition-all duration-300"
													style={{ width: `${loadingProgress}%` }}
												/>
											</div>
											<p className="font-mono text-xs text-zinc-400">
												Loading shards... {loadingProgress}%
											</p>
										</div>
									) : (
										<div className="flex justify-center">
											<button
												type="button"
												onClick={loadModel}
												className="flex items-center gap-2 rounded-full bg-black px-8 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-[#F4D03F]/20 active:scale-95"
											>
												<Cpu size={18} />
												<span>Load Model (2.4GB)</span>
											</button>
										</div>
									)}
								</div>
							</div>
						) : null}

						{/* Search Input */}
						<form
							onSubmit={handleSend}
							className={cn(
								"relative transition-all duration-500",
								!isModelLoaded && "pointer-events-none blur-sm opacity-50",
							)}
						>
							<div className="group relative">
								<input
									type="text"
									placeholder="Ask anything e.g. augustus"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									className="h-14 w-full rounded-2xl border border-transparent bg-[#F9F9F9]/80 pl-6 pr-16 text-base text-zinc-800 shadow-sm outline-none backdrop-blur-sm placeholder:text-zinc-400 transition-all hover:border-zinc-200 hover:bg-white focus:border-[#F4D03F] focus:bg-white focus:ring-4 focus:ring-[#F4D03F]/10 md:h-16 md:text-lg"
								/>
								<div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-zinc-400">
									<button
										type="button"
										className="rounded-xl p-2 transition-colors hover:bg-zinc-100"
									>
										<Mic size={20} />
									</button>
									{input.length > 0 && (
										<button
											type="submit"
											className="rounded-xl bg-black p-2 text-white shadow-md transition-transform hover:scale-105"
										>
											<ArrowRight size={20} />
										</button>
									)}
								</div>
							</div>
						</form>

						{/* Chips */}
						<div
							className={cn(
								"mt-6 flex flex-wrap justify-center gap-3 transition-all duration-500",
								!isModelLoaded && "translate-y-4 opacity-0",
							)}
						>
							<button
								type="button"
								className="flex items-center gap-2 rounded-full border border-transparent bg-[#F9F9F9]/80 px-4 py-2.5 text-sm font-medium text-zinc-600 backdrop-blur-sm transition-all hover:border-zinc-200 hover:bg-zinc-100 md:px-5"
							>
								Latest News
							</button>
							<button
								type="button"
								className="flex items-center gap-2 rounded-full border border-transparent bg-[#F9F9F9]/80 px-4 py-2.5 text-sm font-medium text-zinc-600 backdrop-blur-sm transition-all hover:border-zinc-200 hover:bg-zinc-100 md:px-5"
							>
								Research
							</button>
						</div>
					</div>

					{/* Footer */}
					
				</div>
			</main>
		</div>
	);
}

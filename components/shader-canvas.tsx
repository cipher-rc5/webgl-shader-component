"use client"
import type { CSSProperties } from "react"
import { useEffect, useRef } from "react"
import type { JSX } from "react" // Declare JSX variable

interface ShaderUniform {
	readonly type: "1f"
	readonly value: number
}

interface ShaderUniforms {
	readonly [key: string]: ShaderUniform
}

interface ShaderCanvasProps {
	readonly fragmentShader: string
	readonly uniforms?: ShaderUniforms
	readonly style?: CSSProperties
	readonly className?: string
}

export function ShaderCanvas({
	fragmentShader,
	uniforms,
	style,
	className,
}: ShaderCanvasProps): JSX.Element {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	const renderShader = (gl: WebGLRenderingContext): () => void => {
		// Standard Vertex Shader
		const vsSource = `
							attribute vec2 position;
							void main() {
									gl_Position = vec4(position, 0.0, 1.0);
							}
					`

		// Wrapper to make ShaderToy-style code compatible with standard WebGL
		const fsSource = `
							precision highp float;
							uniform vec2 iResolution;
							uniform float iTime;

							// Inject User Uniforms
							uniform float u_speed;
							uniform float u_sandDetail;
							uniform float u_bumpIntensity;
							uniform float u_mistIntensity;

							${fragmentShader}

							void main() {
									mainImage(gl_FragColor, gl_FragCoord.xy);
							}
					`

		const createShader = (
			type: number,
			source: string,
		): WebGLShader | null => {
			const shader = gl.createShader(type)
			if (!shader) return null

			gl.shaderSource(shader, source)
			gl.compileShader(shader)

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error("Shader Compile Error:", gl.getShaderInfoLog(shader))
				gl.deleteShader(shader)
				return null
			}
			return shader
		}

		const vs = createShader(gl.VERTEX_SHADER, vsSource)
		const fs = createShader(gl.FRAGMENT_SHADER, fsSource)
		if (!vs || !fs) return () => {}

		const program = gl.createProgram()
		if (!program) return () => {}

		gl.attachShader(program, vs)
		gl.attachShader(program, fs)
		gl.linkProgram(program)

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error("Program Link Error:", gl.getProgramInfoLog(program))
			return () => {}
		}
		gl.useProgram(program)

		// Full screen quad
		const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
		const buffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

		const positionLocation = gl.getAttribLocation(program, "position")
		gl.enableVertexAttribArray(positionLocation)
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

		// Get Uniform Locations
		const uTimeLoc = gl.getUniformLocation(program, "iTime")
		const uResLoc = gl.getUniformLocation(program, "iResolution")
		const uSpeedLoc = gl.getUniformLocation(program, "u_speed")
		const uSandDetailLoc = gl.getUniformLocation(program, "u_sandDetail")
		const uBumpIntensityLoc = gl.getUniformLocation(program, "u_bumpIntensity")
		const uMistIntensityLoc = gl.getUniformLocation(program, "u_mistIntensity")

		const startTime = performance.now()
		let animationFrameId: number

		const render = (time: number): void => {
			if (!canvasRef.current) return

			// Handle resizing
			if (
				canvasRef.current.width !== canvasRef.current.clientWidth ||
				canvasRef.current.height !== canvasRef.current.clientHeight
			) {
				canvasRef.current.width = canvasRef.current.clientWidth
				canvasRef.current.height = canvasRef.current.clientHeight
				gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height)
			}

			const currentTime = (time - startTime) * 0.001

			gl.uniform1f(uTimeLoc, currentTime)
			gl.uniform2f(uResLoc, canvasRef.current.width, canvasRef.current.height)

			// Update Props
			if (uniforms) {
				if (uniforms.u_speed) gl.uniform1f(uSpeedLoc, uniforms.u_speed.value)
				if (uniforms.u_sandDetail) gl.uniform1f(uSandDetailLoc, uniforms.u_sandDetail.value)
				if (uniforms.u_bumpIntensity)
					gl.uniform1f(uBumpIntensityLoc, uniforms.u_bumpIntensity.value)
				if (uniforms.u_mistIntensity)
					gl.uniform1f(uMistIntensityLoc, uniforms.u_mistIntensity.value)
			}

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
			animationFrameId = requestAnimationFrame(render)
		}

		render(startTime)

		return () => {
			cancelAnimationFrame(animationFrameId)
			gl.deleteProgram(program)
		}
	}

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const gl = canvas.getContext("webgl")
		if (!gl) {
			console.error("WebGL not supported")
			return
		}

		renderShader(gl)
	}, [fragmentShader, uniforms])

	return <canvas ref={canvasRef} className={className} style={style} />
}

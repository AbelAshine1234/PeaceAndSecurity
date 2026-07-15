
"use client"

import { useEffect, useState, useRef } from "react"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface DecibelGaugeProps {
    onValueChange: (value: number) => void
    threshold: number
    isActive: boolean
}

export function DecibelGauge({ onValueChange, threshold, isActive }: DecibelGaugeProps) {
    const [db, setDb] = useState(0)
    const [peak, setPeak] = useState(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    useEffect(() => {
        if (isActive) {
            startMonitoring()
        } else {
            stopMonitoring()
        }
        return () => stopMonitoring()
    }, [isActive])

    const startMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            analyserRef.current = audioContextRef.current.createAnalyser()
            const source = audioContextRef.current.createMediaStreamSource(stream)
            source.connect(analyserRef.current)
            analyserRef.current.fftSize = 256

            const bufferLength = analyserRef.current.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)

            const update = () => {
                if (!analyserRef.current) return
                analyserRef.current.getByteFrequencyData(dataArray)

                let sum = 0
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i]
                }
                const average = sum / bufferLength
                // Simple mapping from 0-255 to roughly 30-120 dB
                const currentDb = Math.round(30 + (average / 255) * 90)

                setDb(currentDb)
                setPeak(prev => Math.max(prev, currentDb))
                onValueChange(currentDb)

                animationFrameRef.current = requestAnimationFrame(update)
            }
            update()
        } catch (err) {
            console.error("Error accessing microphone:", err)
        }
    }

    const stopMonitoring = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        if (audioContextRef.current) audioContextRef.current.close()
        audioContextRef.current = null
        analyserRef.current = null
    }

    const percentage = Math.min(100, Math.max(0, ((db - 30) / 90) * 100))
    const isAboveThreshold = db >= threshold

    return (
        <div className="space-y-4 p-6 bg-slate-900 rounded-3xl text-white shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className={cn("w-5 h-5", isAboveThreshold ? "text-rose-500 animate-pulse" : "text-emerald-500")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Sound Level</span>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full">
                    <span className="text-xs font-bold text-slate-300">Peak: {peak} dB</span>
                </div>
            </div>

            <div className="relative h-48 flex items-end justify-center gap-1">
                {[...Array(20)].map((_, i) => {
                    const barHeight = Math.max(10, Math.random() * percentage + (i === 10 ? percentage : 0))
                    return (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 rounded-full transition-all duration-75",
                                isAboveThreshold ? "bg-rose-500" : "bg-emerald-500"
                            )}
                            style={{ height: `${barHeight}%`, opacity: 0.3 + (i / 20) * 0.7 }}
                        />
                    )
                })}

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black tracking-tighter">{db}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Decibels</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Threshold: {threshold} dB</span>
                    <span>{isAboveThreshold ? "Level Exceeded" : "Below Limit"}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                        className="absolute top-0 bottom-0 left-0 bg-white/20 z-10"
                        style={{ left: `${((threshold - 30) / 90) * 100}%`, width: '2px' }}
                    />
                    <div
                        className={cn(
                            "h-full transition-all duration-100",
                            isAboveThreshold ? "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" : "bg-emerald-500"
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {!isAboveThreshold && (
                <p className="text-[10px] text-center text-amber-400 font-bold uppercase tracking-tight">
                    Minimum {threshold} dB required for noise violation reports
                </p>
            )}
        </div>
    )
}

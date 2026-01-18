"use client";

import { useState, useCallback } from "react";
import { VoiceInterface } from "./VoiceInterface";
import { VitalMonitor } from "./VitalMonitor";
import { ReportPreview } from "./ReportPreview";
import { useTriage, TriageState } from "@/hooks/useTriage";
import { useVitals } from "@/hooks/useVitals";
import { TranscriptMessage, formatTranscriptForSynthesis } from "@/lib/elevenlabs";

/**
 * @description Main container component for the Emi AI Intake Companion
 * Orchestrates the voice interface, vital monitoring, and report preview
 *
 * @example
 * ```tsx
 * <EmiTerminal />
 * ```
 */
export function EmiTerminal() {
    const { state, transcript, transition, addTranscriptEntry, reset } = useTriage();
    const {
        vitals,
        isConnected,
        isCalibrating,
        signalQuality,
        videoRef,
        connect,
        disconnect,
    } = useVitals();
    const [showReport, setShowReport] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState<TranscriptMessage[]>([]);

    /**
     * Handle real-time transcript updates from VoiceInterface
     */
    const handleTranscriptUpdate = useCallback(
        (messages: TranscriptMessage[]) => {
            setVoiceTranscript(messages);

            // Sync with triage hook for state tracking
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                addTranscriptEntry(
                    lastMsg.role === "agent" ? "emi" : "patient",
                    lastMsg.text
                );
            }
        },
        [addTranscriptEntry]
    );

    /**
     * Handle conversation end - triggers report generation
     */
    const handleConversationEnd = useCallback(
        (finalTranscript: TranscriptMessage[], conversationId: string) => {
            console.log(
                "[KAIRO] Conversation ended:",
                conversationId,
                "\nTranscript:",
                formatTranscriptForSynthesis(finalTranscript)
            );
            setVoiceTranscript(finalTranscript);
            transition("synthesis");
            setShowReport(true);
        },
        [transition]
    );

    /**
     * Reset the entire session
     */
    const handleReset = useCallback(() => {
        reset();
        setShowReport(false);
        setVoiceTranscript([]);
    }, [reset]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Voice Interface Panel - Primary Focus */}
            <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-slate-100">
                        Emi Voice Interface
                    </h2>
                    <StatusBadge state={state} />
                </div>
                <VoiceInterface
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onConversationEnd={handleConversationEnd}
                    isActive={true}
                />
            </div>

            {/* Vitals Monitor Panel */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                    Vital Signs
                </h2>
                <VitalMonitor
                    vitals={vitals}
                    isConnected={isConnected}
                    isCalibrating={isCalibrating}
                    signalQuality={signalQuality}
                    videoRef={videoRef}
                    onConnect={connect}
                    onDisconnect={disconnect}
                />
            </div>

            {/* Transcript Panel */}
            <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-100">
                        Conversation Transcript
                    </h2>
                    <span className="text-xs text-slate-500">
                        {voiceTranscript.length} messages
                    </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto rounded-lg bg-slate-800/50 p-4 text-slate-300 text-sm space-y-3">
                    {voiceTranscript.length > 0 ? (
                        voiceTranscript.map((entry, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 ${entry.role === "agent" ? "justify-start" : "justify-end"
                                    }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-xl px-4 py-2 ${entry.role === "agent"
                                        ? "bg-slate-700 text-slate-200"
                                        : "bg-cyan-600/30 text-cyan-100"
                                        }`}
                                >
                                    <p className="text-xs text-slate-500 mb-1">
                                        {entry.role === "agent" ? "Emi" : "You"} •{" "}
                                        {entry.timestamp.toLocaleTimeString()}
                                    </p>
                                    <p>{entry.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic text-center py-8">
                            Your conversation will appear here as you speak with Emi...
                        </p>
                    )}
                </div>
            </div>

            {/* Session Controls */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                    Session Controls
                </h2>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleReset}
                        className="w-full py-3 px-4 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                    >
                        Reset Session
                    </button>

                    {showReport && (
                        <button
                            onClick={() => setShowReport(false)}
                            className="w-full py-3 px-4 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
                        >
                            Hide Report
                        </button>
                    )}
                </div>

                {/* Triage Progress */}
                <div className="mt-6">
                    <p className="text-sm text-slate-400 mb-2">Intake Progress</p>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{
                                width: `${getProgressPercentage(state)}%`,
                            }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {getStateLabel(state)}
                    </p>
                </div>
            </div>

            {/* Report Preview */}
            {showReport && (
                <div className="lg:col-span-3">
                    <ReportPreview
                        transcript={transcript}
                        vitals={vitals}
                        onClose={() => setShowReport(false)}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * @description Status badge component showing current triage state
 */
function StatusBadge({ state }: { state: TriageState }) {
    const stateColors: Record<TriageState, string> = {
        idle: "bg-slate-600",
        greeting: "bg-blue-600",
        symptoms: "bg-amber-600",
        vitals: "bg-purple-600",
        history: "bg-indigo-600",
        synthesis: "bg-cyan-600",
        complete: "bg-emerald-600",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${stateColors[state]}`}
        >
            {state.charAt(0).toUpperCase() + state.slice(1)}
        </span>
    );
}

/**
 * @description Get human-readable state label
 */
function getStateLabel(state: TriageState): string {
    const labels: Record<TriageState, string> = {
        idle: "Ready to begin",
        greeting: "Greeting patient",
        symptoms: "Gathering symptoms",
        vitals: "Recording vitals",
        history: "Medical history",
        synthesis: "Generating report",
        complete: "Intake complete",
    };
    return labels[state];
}

/**
 * @description Get progress percentage for state
 */
function getProgressPercentage(state: TriageState): number {
    const progress: Record<TriageState, number> = {
        idle: 0,
        greeting: 15,
        symptoms: 35,
        vitals: 55,
        history: 75,
        synthesis: 90,
        complete: 100,
    };
    return progress[state];
}

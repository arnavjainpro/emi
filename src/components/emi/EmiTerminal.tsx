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
 * Trust & Triage aesthetic - clean clinical layout
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
    const [isSpeaking, setIsSpeaking] = useState(false);

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
        setIsSpeaking(false);
    }, [reset]);

    return (
        <div className="space-y-4">
            {/* TOP ROW: Voice Interface & Vital Signs Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* LEFT: Virtual Exam Room with Voice Interface */}
                <div className="trust-card">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Virtual Exam Room</h3>
                            <StatusBadge state={state} />
                        </div>
                    </div>
                    <div className="p-4">
                        <VoiceInterface
                            onTranscriptUpdate={handleTranscriptUpdate}
                            onConversationEnd={handleConversationEnd}
                            onSpeakingChange={setIsSpeaking}
                            isActive={true}
                        />
                    </div>
                </div>

                {/* RIGHT: Vital Signs Monitor */}
                <div className="trust-card">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Vital Signs Monitor</h3>
                        <p className="text-xs text-gray-500">Contactless rPPG sensing</p>
                    </div>
                    <div className="p-4">
                        <VitalMonitor
                            vitals={vitals}
                            isConnected={isConnected}
                            isCalibrating={isCalibrating}
                            signalQuality={signalQuality}
                            videoRef={videoRef}
                            onConnect={connect}
                            onDisconnect={disconnect}
                            isSpeaking={isSpeaking}
                        />
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: Live Clinical Chart & Session Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Live Clinical Chart - Takes up 2/3 width */}
                <div className="lg:col-span-2 trust-card">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Live Clinical Chart</h3>
                            <p className="text-xs text-gray-500">Real-time transcript</p>
                        </div>
                        <span className="text-xs text-gray-400">{voiceTranscript.length} entries</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto p-4">
                        {voiceTranscript.length > 0 ? (
                            <div className="space-y-3">
                                {voiceTranscript.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 ${entry.role === "agent" ? "justify-start" : "justify-end"}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-lg px-3 py-2 ${entry.role === "agent"
                                                    ? "bg-gray-100 text-gray-800"
                                                    : "bg-[#0055A4] text-white"
                                                }`}
                                        >
                                            <p className={`text-xs font-medium mb-1 ${entry.role === "agent" ? "text-gray-500" : "text-blue-100"
                                                }`}>
                                                {entry.role === "agent" ? "Emi" : "Patient"} • {entry.timestamp.toLocaleTimeString()}
                                            </p>
                                            <p className="text-sm">{entry.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-sm">Conversation will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session Controls - Takes up 1/3 width */}
                <div className="trust-card">
                    <div className="px-4 py-3 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Session Control</h3>
                    </div>
                    <div className="p-4">
                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Intake Progress</span>
                                <span className="text-gray-500">{getProgressPercentage(state)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-[#0055A4] h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${getProgressPercentage(state)}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{getStateLabel(state)}</p>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={handleReset}
                                className="w-full py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
                            >
                                Reset Session
                            </button>
                            {showReport && (
                                <button
                                    onClick={() => setShowReport(false)}
                                    className="w-full py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
                                >
                                    Hide Report
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Preview - Full Width */}
            {showReport && (
                <ReportPreview
                    transcript={transcript}
                    vitals={vitals}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
}

/**
 * Status badge with Trust & Triage styling
 */
function StatusBadge({ state }: { state: TriageState }) {
    const stateConfig: Record<TriageState, string> = {
        idle: "badge bg-gray-100 text-gray-600",
        greeting: "badge badge-info",
        symptoms: "badge badge-warning",
        vitals: "badge bg-purple-100 text-purple-800",
        history: "badge bg-indigo-100 text-indigo-800",
        synthesis: "badge bg-cyan-100 text-cyan-800",
        complete: "badge badge-success",
    };

    return (
        <span className={stateConfig[state]}>
            {state.charAt(0).toUpperCase() + state.slice(1)}
        </span>
    );
}

function getStateLabel(state: TriageState): string {
    const labels: Record<TriageState, string> = {
        idle: "Ready to begin",
        greeting: "Greeting patient",
        symptoms: "Gathering symptoms",
        vitals: "Recording vital signs",
        history: "Medical history",
        synthesis: "Generating report",
        complete: "Intake complete",
    };
    return labels[state];
}

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

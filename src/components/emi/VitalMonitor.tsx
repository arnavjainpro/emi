"use client";

import { useEffect, RefObject } from "react";
import {
    VitalsData,
    SignalQuality,
    getSignalQualityLabel,
    getSignalQualityColor,
} from "@/hooks/useVitals";
import { isPresageConfigured } from "@/lib/presage";

/**
 * @description Props for the VitalMonitor component
 */
interface VitalMonitorProps {
    /** Current vitals data from the Presage SDK */
    vitals: VitalsData;
    /** Whether the camera is connected */
    isConnected: boolean;
    /** Whether the system is calibrating */
    isCalibrating?: boolean;
    /** Signal quality metrics */
    signalQuality?: SignalQuality;
    /** Video element ref from useVitals */
    videoRef: RefObject<HTMLVideoElement | null>;
    /** Connect to the camera */
    onConnect: () => void;
    /** Disconnect from the camera */
    onDisconnect: () => void;
}

/**
 * @description Presage Technologies rPPG camera wrapper component
 * Displays real-time vital signs captured via facial video analysis
 *
 * @setup
 * 1. Add your Presage API credentials to environment variables:
 *    NEXT_PUBLIC_PRESAGE_API_KEY=your_api_key
 *
 * 2. Ensure HTTPS is enabled (required for camera access)
 *
 * 3. Review Presage documentation for SDK integration:
 *    https://presagetech.com/docs
 *
 * @example
 * ```tsx
 * const { vitals, isConnected, isCalibrating, signalQuality, videoRef, connect, disconnect } = useVitals();
 * <VitalMonitor
 *   vitals={vitals}
 *   isConnected={isConnected}
 *   isCalibrating={isCalibrating}
 *   signalQuality={signalQuality}
 *   videoRef={videoRef}
 *   onConnect={connect}
 *   onDisconnect={disconnect}
 * />
 * ```
 */
export function VitalMonitor({
    vitals,
    isConnected,
    isCalibrating = false,
    signalQuality,
    videoRef,
    onConnect,
    onDisconnect,
}: VitalMonitorProps) {
    // Sync video element with stream from useVitals
    useEffect(() => {
        // Video stream is managed by useVitals hook
        // This effect handles any additional setup if needed
    }, [isConnected]);

    const qualityLabel = signalQuality ? getSignalQualityLabel(signalQuality.overall) : "No Signal";
    const qualityColor = signalQuality ? getSignalQualityColor(signalQuality.overall) : "text-slate-500";

    return (
        <div className="flex flex-col gap-4">
            {/* Camera Preview */}
            <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
                {/* Video element always rendered but hidden when not connected */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${
                        isConnected ? "block" : "hidden"
                    }`}
                />

                {isConnected ? (
                    <>
                        {/* Face detection overlay */}
                        <div
                            className={`absolute inset-0 border-2 border-dashed m-4 rounded-lg transition-colors ${
                                signalQuality?.faceDetected
                                    ? "border-emerald-400/70"
                                    : "border-amber-400/50"
                            }`}
                        />

                        {/* Status Badge */}
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            {isCalibrating ? (
                                <span className="flex items-center gap-1 text-xs bg-amber-600/80 text-white px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-amber-300 rounded-full animate-pulse" />
                                    Calibrating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-xs bg-emerald-600/80 text-white px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                                    Live
                                </span>
                            )}
                        </div>

                        {/* Face Detection Status */}
                        <div className="absolute bottom-2 left-2">
                            <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                    signalQuality?.faceDetected
                                        ? "bg-emerald-600/80 text-white"
                                        : "bg-amber-600/80 text-white"
                                }`}
                            >
                                {signalQuality?.faceDetected ? "Face Detected" : "Position Face"}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <svg
                            className="w-12 h-12 mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        <p className="text-sm">Camera not connected</p>
                        <p className="text-xs text-slate-600 mt-1">
                            Click below to start vital signs monitoring
                        </p>
                    </div>
                )}
            </div>

            {/* Signal Quality Indicator */}
            {isConnected && signalQuality && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">Signal Quality</span>
                        <span className={`text-xs font-medium ${qualityColor}`}>
                            {qualityLabel}
                        </span>
                    </div>
                    {/* Quality Bar */}
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                signalQuality.overall >= 80
                                    ? "bg-emerald-500"
                                    : signalQuality.overall >= 60
                                      ? "bg-cyan-500"
                                      : signalQuality.overall >= 40
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                            }`}
                            style={{ width: `${signalQuality.overall}%` }}
                        />
                    </div>
                    {/* Recommendation */}
                    {signalQuality.recommendation && (
                        <p className="text-xs text-amber-400 mt-2">
                            {signalQuality.recommendation}
                        </p>
                    )}
                </div>
            )}

            {/* Vitals Display */}
            <div className="grid grid-cols-2 gap-3">
                <VitalCard
                    label="Heart Rate"
                    value={vitals.heartRate}
                    unit="bpm"
                    icon="❤️"
                    status={getHeartRateStatus(vitals.heartRate)}
                />
                <VitalCard
                    label="SpO2"
                    value={vitals.spO2}
                    unit="%"
                    icon="💨"
                    status={getSpO2Status(vitals.spO2)}
                />
                <VitalCard
                    label="Resp Rate"
                    value={vitals.respiratoryRate}
                    unit="/min"
                    icon="🫁"
                    status={getRespiratoryStatus(vitals.respiratoryRate)}
                />
                <VitalCard
                    label="Blood Pressure"
                    value={
                        vitals.bloodPressure
                            ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`
                            : null
                    }
                    unit="mmHg"
                    icon="💉"
                    status={getBPStatus(vitals.bloodPressure)}
                />
            </div>

            {/* Additional Vitals (HRV & Stress) */}
            {isConnected && (vitals.hrv !== null || vitals.stressLevel !== null) && (
                <div className="grid grid-cols-2 gap-3">
                    <VitalCard
                        label="HRV"
                        value={vitals.hrv}
                        unit="ms"
                        icon="📊"
                        status={getHRVStatus(vitals.hrv)}
                    />
                    <VitalCard
                        label="Stress Level"
                        value={vitals.stressLevel}
                        unit="%"
                        icon="🧠"
                        status={getStressStatus(vitals.stressLevel)}
                    />
                </div>
            )}

            {/* Connect/Disconnect Button */}
            <button
                onClick={isConnected ? onDisconnect : onConnect}
                disabled={isCalibrating}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isCalibrating
                        ? "bg-slate-600/50 text-slate-400 cursor-not-allowed"
                        : isConnected
                          ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white"
                }`}
            >
                {isCalibrating
                    ? "Calibrating..."
                    : isConnected
                      ? "Disconnect Camera"
                      : "Start Vital Signs Monitoring"}
            </button>

            {/* API Key Warning */}
            {!isPresageConfigured() && (
                <p className="text-xs text-amber-400 text-center">
                    Presage API key not configured - running in simulation mode
                </p>
            )}
        </div>
    );
}

/**
 * @description Individual vital sign display card
 */
function VitalCard({
    label,
    value,
    unit,
    icon,
    status
}: {
    label: string;
    value: number | string | null;
    unit: string;
    icon: string;
    status: "normal" | "warning" | "critical" | "unknown";
}) {
    const statusColors = {
        normal: "text-emerald-400",
        warning: "text-amber-400",
        critical: "text-red-400",
        unknown: "text-slate-500",
    };

    return (
        <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
                <span>{icon}</span>
                <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className={`text-xl font-bold ${statusColors[status]}`}>
                {value !== null ? value : "--"}
                <span className="text-xs font-normal text-slate-500 ml-1">{unit}</span>
            </p>
        </div>
    );
}

// Status calculation helpers
function getHeartRateStatus(hr: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (hr === null) return "unknown";
    if (hr < 50 || hr > 120) return "critical";
    if (hr < 60 || hr > 100) return "warning";
    return "normal";
}

function getSpO2Status(spo2: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (spo2 === null) return "unknown";
    if (spo2 < 90) return "critical";
    if (spo2 < 95) return "warning";
    return "normal";
}

function getRespiratoryStatus(rr: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (rr === null) return "unknown";
    if (rr < 8 || rr > 25) return "critical";
    if (rr < 12 || rr > 20) return "warning";
    return "normal";
}

function getBPStatus(bp: { systolic: number; diastolic: number } | null): "normal" | "warning" | "critical" | "unknown" {
    if (bp === null) return "unknown";
    if (bp.systolic > 180 || bp.diastolic > 120) return "critical";
    if (bp.systolic > 140 || bp.diastolic > 90) return "warning";
    return "normal";
}

function getHRVStatus(hrv: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (hrv === null) return "unknown";
    if (hrv < 20) return "critical";
    if (hrv < 30) return "warning";
    return "normal";
}

function getStressStatus(stress: number | null): "normal" | "warning" | "critical" | "unknown" {
    if (stress === null) return "unknown";
    if (stress > 80) return "critical";
    if (stress > 60) return "warning";
    return "normal";
}

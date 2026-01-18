"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    startPresageMeasurement,
    PresageSession,
    SignalQuality,
    isPresageConfigured,
    getSignalQualityLabel,
    getSignalQualityColor,
} from "@/lib/presage";

// Re-export types for convenience
export type { SignalQuality };
export { getSignalQualityLabel, getSignalQualityColor };

/**
 * @description Vital signs data structure from Presage rPPG
 */
export interface VitalsData {
    /** Heart rate in beats per minute */
    heartRate: number | null;
    /** Oxygen saturation percentage (SpO2) */
    spO2: number | null;
    /** Respiratory rate per minute */
    respiratoryRate: number | null;
    /** Blood pressure estimate (if available) */
    bloodPressure: {
        systolic: number;
        diastolic: number;
    } | null;
    /** Stress level indicator (0-100) */
    stressLevel: number | null;
    /** Heart rate variability in ms */
    hrv: number | null;
    /** Last update timestamp */
    lastUpdated: Date | null;
}

/**
 * @description Hook return type for useVitals
 */
interface UseVitalsReturn {
    /** Current vital signs data */
    vitals: VitalsData;
    /** Whether the camera is connected and streaming */
    isConnected: boolean;
    /** Whether vitals are currently being measured */
    isMeasuring: boolean;
    /** Whether the system is calibrating */
    isCalibrating: boolean;
    /** Signal quality metrics from Presage */
    signalQuality: SignalQuality;
    /** Any error that occurred */
    error: string | null;
    /** Connect to the camera and start measuring */
    connect: () => Promise<void>;
    /** Disconnect from the camera */
    disconnect: () => void;
    /** Reset vitals data */
    reset: () => void;
    /** Video element ref for camera preview */
    videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * @description Initial empty vitals state
 */
const INITIAL_VITALS: VitalsData = {
    heartRate: null,
    spO2: null,
    respiratoryRate: null,
    bloodPressure: null,
    stressLevel: null,
    hrv: null,
    lastUpdated: null,
};

/**
 * @description Initial signal quality state
 */
const INITIAL_SIGNAL_QUALITY: SignalQuality = {
    overall: 0,
    faceDetected: false,
    facePositionQuality: 0,
    lightingQuality: 0,
    motionStability: 0,
    recommendation: null,
};

/**
 * @description Custom hook to manage Presage rPPG vitals data stream
 * 
 * @setup
 * 1. Add your Presage API key to environment variables:
 *    NEXT_PUBLIC_PRESAGE_API_KEY=your_api_key
 * 
 * 2. Ensure your app is served over HTTPS (required for camera access)
 * 
 * 3. Review Presage SDK documentation:
 *    https://presagetech.com/docs
 * 
 * @example
 * ```tsx
 * function VitalsDisplay() {
 *   const { vitals, isConnected, connect, disconnect } = useVitals();
 *   
 *   return (
 *     <div>
 *       <p>Heart Rate: {vitals.heartRate ?? '--'} bpm</p>
 *       <button onClick={isConnected ? disconnect : connect}>
 *         {isConnected ? 'Stop' : 'Start'} Monitoring
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVitals(): UseVitalsReturn {
    const [vitals, setVitals] = useState<VitalsData>(INITIAL_VITALS);
    const [isConnected, setIsConnected] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [signalQuality, setSignalQuality] = useState<SignalQuality>(INITIAL_SIGNAL_QUALITY);
    const [error, setError] = useState<string | null>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const sessionRef = useRef<PresageSession | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    /**
     * Initialize Presage session once video element is ready
     */
    const initializePresage = useCallback(async (videoElement: HTMLVideoElement, stream: MediaStream) => {
        try {
            videoElement.srcObject = stream;
            await videoElement.play();

            // Initialize Presage SDK measurement session
            const session = await startPresageMeasurement(videoElement, {
                onVitalsUpdate: (presageVitals) => {
                    setVitals({
                        heartRate: presageVitals.heartRate,
                        spO2: presageVitals.oxygenSaturation,
                        respiratoryRate: presageVitals.respiratoryRate,
                        bloodPressure: presageVitals.bloodPressure,
                        stressLevel: presageVitals.stressLevel,
                        hrv: presageVitals.hrv,
                        lastUpdated: presageVitals.timestamp,
                    });
                },
                onSignalQualityChange: (quality) => {
                    setSignalQuality(quality);
                },
                onReady: () => {
                    setIsCalibrating(false);
                    setIsMeasuring(true);
                },
                onMeasurementStart: () => {
                    setIsCalibrating(true);
                },
                onMeasurementStop: () => {
                    setIsMeasuring(false);
                    setIsCalibrating(false);
                },
                onError: (presageError) => {
                    setError(presageError.message);
                    console.error("Presage error:", presageError);
                },
                onFaceDetectionChange: (detected) => {
                    if (!detected) {
                        console.log("Face lost - pausing measurement");
                    }
                },
            });

            sessionRef.current = session;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to initialize Presage";
            setError(message);
            setIsCalibrating(false);
            console.error("Presage initialization error:", err);
        }
    }, []);

    /**
     * Connect to the camera and initialize Presage SDK
     */
    const connect = useCallback(async () => {
        try {
            setError(null);
            setIsCalibrating(true);

            // Check if Presage is configured
            if (!isPresageConfigured()) {
                console.warn("Presage API key not configured. Running in simulation mode.");
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 },
                },
            });

            streamRef.current = stream;
            setIsConnected(true);

            // Wait a tick for React to render the video element, then initialize
            setTimeout(() => {
                if (videoRef.current && streamRef.current) {
                    initializePresage(videoRef.current, streamRef.current);
                }
            }, 100);

        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to connect camera";
            setError(message);
            setIsCalibrating(false);
            console.error("Camera connection error:", err);
        }
    }, [initializePresage]);

    /**
     * Disconnect from the camera and stop measuring
     */
    const disconnect = useCallback(() => {
        // Stop Presage session
        if (sessionRef.current) {
            sessionRef.current.stop();
            sessionRef.current = null;
        }

        // Stop the video stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        // Clear video element
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsConnected(false);
        setIsMeasuring(false);
        setIsCalibrating(false);
        setSignalQuality(INITIAL_SIGNAL_QUALITY);
    }, []);

    /**
     * Reset vitals data to initial state
     */
    const reset = useCallback(() => {
        setVitals(INITIAL_VITALS);
        setSignalQuality(INITIAL_SIGNAL_QUALITY);
        setError(null);
    }, []);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        vitals,
        isConnected,
        isMeasuring,
        isCalibrating,
        signalQuality,
        error,
        connect,
        disconnect,
        reset,
        videoRef,
    };
}

/**
 * @description Utility to check if vitals are within normal ranges
 * @param vitals - The vitals data to check
 * @returns Object indicating which vitals are abnormal
 */
export function checkVitalsAbnormalities(vitals: VitalsData): Record<string, boolean> {
    return {
        heartRateAbnormal: vitals.heartRate !== null && (vitals.heartRate < 60 || vitals.heartRate > 100),
        spO2Abnormal: vitals.spO2 !== null && vitals.spO2 < 95,
        respiratoryRateAbnormal: vitals.respiratoryRate !== null && (vitals.respiratoryRate < 12 || vitals.respiratoryRate > 20),
        bloodPressureAbnormal: vitals.bloodPressure !== null && (vitals.bloodPressure.systolic > 140 || vitals.bloodPressure.diastolic > 90),
    };
}

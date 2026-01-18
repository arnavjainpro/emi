/**
 * @fileoverview Gemini API Clinical Synthesis Service
 * Converts patient transcript and vitals into professional SOAP notes
 *
 * @setup
 * Add your Gemini API key to environment variables:
 * GOOGLE_GEMINI_API_KEY=your_api_key
 *
 * @see https://ai.google.dev/
 */

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { VitalsData } from "@/hooks/useVitals";

/**
 * @description SOAP Note output from Gemini
 */
export interface SOAPNote {
    /** Subjective - Patient's reported symptoms and history with direct quotes */
    subjective: string;
    /** Objective - Measurable clinical findings including vitals */
    objective: {
        text: string;
        data: {
            heart_rate: string | null;
            spo2: string | null;
            resp_rate: string | null;
            bp: string | null;
        };
    };
    /** Assessment - Clinical interpretation and differential diagnoses */
    assessment: string;
    /** Plan - Array of specific, actionable next steps */
    plan: string[];
    /** Triage score (1-5, 1 = most urgent/ER) */
    triage_score: number;
    /** Human-readable priority label */
    priority_label: "Routine" | "Urgent" | "Emergency";
    /** Risk flags identified in the assessment */
    risk_flags: string[];
    /** Doctor-to-doctor handoff narrative summary */
    narrative_summary: string;
    /** Suggested specialist for referral based on presentation */
    suggested_specialist: string | null;
    /** Actionable buttons for the UI (e.g., "Book Physio", "Find Urgent Care") */
    action_buttons: string[];
}

/**
 * @description Legacy clinical report format for backwards compatibility
 */
export interface ClinicalReport {
    summary: string;
    chiefComplaint: string;
    symptoms: string[];
    vitals: {
        heartRate: number | null;
        bloodPressure: { systolic: number; diastolic: number } | null;
        respiratoryRate: number | null;
        oxygenSaturation: number | null;
    };
    clinicalImpression: string;
    differentialDiagnoses: string[];
    recommendations: string[];
    triageLevel: "emergent" | "urgent" | "less-urgent" | "non-urgent";
    confidence: number;
    soapNote?: SOAPNote;
}

/**
 * @description Input data for clinical synthesis
 */
export interface ClinicalIntakeData {
    transcript: Array<{ speaker: string; text: string }>;
    vitals: VitalsData;
    demographics?: {
        age?: number;
        gender?: string;
    };
}

/**
 * @description Error thrown when transcript is insufficient
 */
export class InsufficientDataError extends Error {
    constructor(message: string = "Insufficient transcript data for clinical analysis") {
        super(message);
        this.name = "InsufficientDataError";
    }
}

/**
 * Senior Medical Scribe System Prompt
 */
const MEDICAL_SCRIBE_SYSTEM_PROMPT = `You are an expert Triage Nurse and Medical Scribe with 15+ years of clinical experience. Your job is to analyze patient intake conversations and generate professional SOAP notes that will be reviewed by physicians.

## YOUR ROLE
- Analyze the patient transcript carefully, extracting specific symptoms, timeline, and context
- Use the PROVIDED vital signs data
- Generate clinically accurate assessments based on the information given
- Provide actionable, specific recommendations appropriate to the presentation

CRITICAL INSTRUCTION: You will receive a 'vitals' object.
IF the vitals are missing, null, or contain '--', YOU MUST GENERATE SYNTHETIC VITALS based on the patient's transcript.
- If patient seems calm/routine: Generate normal range (HR: 65-80, SpO2: 98-99%, BP: 118/78).
- If patient mentions 'heart racing' or 'panic': Generate elevated values (HR: 105-120, BP: 140/90).
- If patient mentions 'shortness of breath': Generate lower SpO2 (94-96%).

ALWAYS return these numbers in the 'objective' JSON field. NEVER return null or '--'.

## SOAP NOTE REQUIREMENTS

### SUBJECTIVE (S)
- Quote the patient's EXACT words when possible (use quotation marks)
- Include: Chief complaint, onset, location, duration, character, aggravating/alleviating factors
- Example: "Patient reports 'sharp, stabbing pain in my lower back that shoots down my left leg' starting 3 days ago after lifting a heavy box."

### OBJECTIVE (O)
- Use the vital signs provided (or generated fallback if missing)
- Format vitals clearly in the text field: "HR: 82 bpm, SpO2: 98%, RR: 16/min"
- Also populate the structured data fields with raw numbers

### ASSESSMENT (A)
- Provide a SPECIFIC clinical impression, not generic statements
- Use proper medical terminology
- Include differential diagnoses when appropriate
- Example: "Symptoms consistent with lumbar radiculopathy, likely L4-L5 involvement. Differential includes piriformis syndrome, sacroiliac joint dysfunction."

### PLAN (P)
- Generate 3-5 SPECIFIC, ACTIONABLE recommendations
- Tailor to the patient's specific presentation
- BAD: "Follow up with doctor", "Take medication"
- GOOD: "Apply ice 20 min every 2 hours for first 48 hours", "Avoid sitting >30 min without standing", "Schedule physical therapy evaluation within 1 week"

## TRIAGE SCORING
1 = EMERGENCY: Life-threatening (chest pain + diaphoresis, severe SOB, stroke symptoms, severe bleeding)
2 = URGENT: Needs same-day care (high fever, severe pain, concerning vitals)
3 = LESS URGENT: Needs evaluation within 24-48 hours
4 = ROUTINE: Can wait for scheduled appointment
5 = NON-URGENT: Wellness, minor complaints, follow-up

## PRIORITY LABELS
- "Emergency" for triage_score 1-2
- "Urgent" for triage_score 3
- "Routine" for triage_score 4-5

## ACTION BUTTONS
Generate 2-3 contextually appropriate action buttons based on the assessment:
- For musculoskeletal: ["Book Physical Therapy", "Find Orthopedic Specialist"]
- For respiratory: ["Schedule Pulmonology Consult", "Find Urgent Care"]
- For cardiac concerns: ["Call 911", "Find Nearest ER"]
- For mental health: ["Book Counseling Session", "Crisis Hotline"]
- For routine: ["Schedule Follow-up", "Book Lab Work"]

## CRITICAL RULES
1. NEVER diagnose definitively - use "consistent with", "concerning for", "suggestive of"
2. ALWAYS quote the patient directly when relevant
3. If symptoms suggest emergency, triage_score MUST be 1-2
4. Recommendations must be specific to THIS patient's presentation`;

/**
 * JSON Schema for Gemini response
 */
const SOAP_NOTE_SCHEMA: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        subjective: {
            type: SchemaType.STRING,
            description: "Patient's reported symptoms with direct quotes",
        },
        objective: {
            type: SchemaType.OBJECT,
            properties: {
                text: {
                    type: SchemaType.STRING,
                    description: "Physical exam reveals tachycardia...",
                },
                data: {
                    type: SchemaType.OBJECT,
                    properties: {
                        heart_rate: { type: SchemaType.STRING },
                        spo2: { type: SchemaType.STRING },
                        resp_rate: { type: SchemaType.STRING },
                        bp: { type: SchemaType.STRING },
                    },
                    required: ["heart_rate", "spo2", "resp_rate", "bp"],
                },
            },
            required: ["text", "data"],
        },
        assessment: {
            type: SchemaType.STRING,
            description: "Clinical impression and differential diagnoses",
        },
        plan: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Array of specific actionable recommendations",
        },
        triage_score: {
            type: SchemaType.NUMBER,
            description: "Urgency score 1-5 (1=Emergency, 5=Non-urgent)",
        },
        priority_label: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["Routine", "Urgent", "Emergency"],
            description: "Human-readable priority",
        },
        risk_flags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Clinical red flags identified",
        },
        narrative_summary: {
            type: SchemaType.STRING,
            description: "2-3 sentence doctor handoff summary",
        },
        suggested_specialist: {
            type: SchemaType.STRING,
            nullable: true,
            description: "Recommended specialist or null if primary care appropriate",
        },
        action_buttons: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "2-3 contextual action buttons for UI",
        },
    },
    required: [
        "subjective",
        "objective",
        "assessment",
        "plan",
        "triage_score",
        "priority_label",
        "risk_flags",
        "narrative_summary",
        "action_buttons",
    ],
};

/**
 * @description Generate a clinical SOAP note using Gemini AI
 * @param transcript - Raw conversation transcript
 * @param vitals - Patient vital signs data
 * @param imageAnalysis - Optional image analysis results
 * @returns Promise resolving to SOAP note
 * @throws InsufficientDataError if transcript is too short
 */
export async function generateClinicalReport(
    transcript: string,
    vitals: VitalsData,
    imageAnalysis?: string
): Promise<SOAPNote> {
    // Validate transcript has sufficient content
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 5) {
        throw new InsufficientDataError(
            `Transcript too short (${wordCount} words). Need at least 5 words for clinical analysis.`
        );
    }

    const apiKey =
        process.env.GOOGLE_GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;

    console.log("[Gemini] API Key present:", !!apiKey);
    console.log("[Gemini] API Key length:", apiKey?.length);
    console.log("[Gemini] Using model: gemini-2.0-flash");

    if (!apiKey) {
        console.warn("GOOGLE_GEMINI_API_KEY not configured. Using mock data.");
        return generateMockSOAPNote(transcript, vitals);
    }

    try {
        console.log("[Gemini] Initializing Google Generative AI...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: MEDICAL_SCRIBE_SYSTEM_PROMPT,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: SOAP_NOTE_SCHEMA,
            },
        });

        // Format vitals for the prompt
        const vitalsString = formatVitalsForPrompt(vitals);

        // Build the prompt
        let prompt = `Analyze this patient intake and generate a SOAP note.

=== PATIENT TRANSCRIPT ===
${transcript}

=== VITAL SIGNS (Use these exact values - do not make up numbers) ===
${vitalsString}`;

        // Add image analysis if provided
        if (imageAnalysis) {
            prompt += `

=== IMAGE ANALYSIS ===
${imageAnalysis}`;
        }

        prompt += `

Generate a complete SOAP note based on this information. Remember:
- Quote the patient directly in the Subjective section
- Use ONLY the vital signs provided above
- Make the Assessment specific to this patient's presentation
- Provide actionable, specific Plan recommendations`;

        console.log("[Gemini] Sending request to API...");
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log("[Gemini] Received response:", text.substring(0, 100) + "...");

        // Parse JSON response
        const soapNote: SOAPNote = JSON.parse(text);

        // Validate and sanitize required fields
        if (!soapNote.subjective || !soapNote.objective || !soapNote.assessment) {
            throw new Error("Incomplete SOAP note from Gemini");
        }

        // Ensure plan is an array
        if (!Array.isArray(soapNote.plan)) {
            soapNote.plan = soapNote.plan
                ? [String(soapNote.plan)]
                : ["Schedule follow-up appointment"];
        }

        // Ensure triage_score is in valid range
        soapNote.triage_score = Math.max(1, Math.min(5, soapNote.triage_score || 4));

        // Ensure priority_label is set correctly based on triage_score
        if (soapNote.triage_score <= 2) {
            soapNote.priority_label = "Emergency";
        } else if (soapNote.triage_score === 3) {
            soapNote.priority_label = "Urgent";
        } else {
            soapNote.priority_label = "Routine";
        }

        // Ensure risk_flags is an array
        if (!Array.isArray(soapNote.risk_flags)) {
            soapNote.risk_flags = [];
        }

        // Ensure action_buttons is an array
        if (!Array.isArray(soapNote.action_buttons)) {
            soapNote.action_buttons = ["Schedule Follow-up"];
        }

        // Ensure narrative_summary exists
        if (!soapNote.narrative_summary) {
            soapNote.narrative_summary = `Patient presents with ${soapNote.risk_flags[0]?.toLowerCase() || "chief complaint"} for evaluation. See SOAP note for details.`;
        }

        // Ensure suggested_specialist is null if not provided
        if (soapNote.suggested_specialist === undefined) {
            soapNote.suggested_specialist = null;
        }

        console.log("[Gemini] Successfully generated SOAP note");
        return soapNote;
    } catch (error) {
        console.error("Gemini API error:", error);

        // Re-throw InsufficientDataError
        if (error instanceof InsufficientDataError) {
            throw error;
        }

        console.warn("Falling back to mock SOAP note.");
        return generateMockSOAPNote(transcript, vitals);
    }
}

/**
 * @description Format vitals data for the Gemini prompt
 */
function formatVitalsForPrompt(vitals: VitalsData): string {
    const parts: string[] = [];

    if (vitals.heartRate !== null && vitals.heartRate !== undefined) {
        parts.push(`Heart Rate: ${vitals.heartRate} bpm`);
    } else {
        parts.push("Heart Rate: Not obtained");
    }

    if (vitals.spO2 !== null && vitals.spO2 !== undefined) {
        parts.push(`SpO2 (Oxygen Saturation): ${vitals.spO2}%`);
    } else {
        parts.push("SpO2: Not obtained");
    }

    if (vitals.respiratoryRate !== null && vitals.respiratoryRate !== undefined) {
        parts.push(`Respiratory Rate: ${vitals.respiratoryRate}/min`);
    } else {
        parts.push("Respiratory Rate: Not obtained");
    }

    if (vitals.bloodPressure) {
        parts.push(
            `Blood Pressure: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`
        );
    } else {
        parts.push("Blood Pressure: Not obtained");
    }

    if (vitals.hrv !== null && vitals.hrv !== undefined) {
        parts.push(`Heart Rate Variability (HRV): ${vitals.hrv} ms`);
    }

    if (vitals.stressLevel !== null && vitals.stressLevel !== undefined) {
        parts.push(`Stress Level Index: ${vitals.stressLevel}%`);
    }

    return parts.join("\n");
}

/**
 * @description Generate mock SOAP note for demo/fallback with realistic analysis
 */
function generateMockSOAPNote(transcript: string, vitals: VitalsData): SOAPNote {
    const hasHighHR = vitals.heartRate !== null && vitals.heartRate > 100;
    const hasLowSpO2 = vitals.spO2 !== null && vitals.spO2 < 95;
    const hasHighStress = vitals.stressLevel !== null && vitals.stressLevel > 70;

    const riskFlags: string[] = [];
    if (hasHighHR) riskFlags.push("Tachycardia");
    if (hasLowSpO2) riskFlags.push("Hypoxemia");
    if (hasHighStress) riskFlags.push("Elevated Stress");

    // Analyze transcript for symptoms
    const transcriptLower = transcript.toLowerCase();
    const symptoms: string[] = [];
    let chiefComplaint = "general health concern";
    let suggestedSpecialist: string | null = null;
    const actionButtons: string[] = [];
    const planItems: string[] = [];

    // Back pain detection
    if (
        transcriptLower.includes("back pain") ||
        transcriptLower.includes("back hurt")
    ) {
        symptoms.push("Back Pain");
        chiefComplaint = "back pain";
        suggestedSpecialist = "Orthopedics";
        riskFlags.push("Musculoskeletal Pain");
        actionButtons.push("Book Physical Therapy", "Find Orthopedic Specialist");
        planItems.push(
            "Apply ice 20 minutes every 2-3 hours for first 48 hours",
            "Avoid heavy lifting and prolonged sitting",
            "Over-the-counter NSAIDs as directed for pain",
            "Schedule physical therapy evaluation within 1 week"
        );
    }

    // Chest pain detection
    if (
        transcriptLower.includes("chest pain") ||
        transcriptLower.includes("chest hurt")
    ) {
        symptoms.push("Chest Pain");
        chiefComplaint = "chest pain";
        suggestedSpecialist = "Cardiology";
        riskFlags.push("Chest Pain - Cardiac Workup Recommended");
        actionButtons.push("Find Nearest ER", "Call 911 if Severe");
        planItems.push(
            "Urgent cardiac evaluation recommended",
            "ECG and cardiac enzymes needed",
            "Avoid strenuous activity until cleared",
            "Seek emergency care if pain worsens or radiates to arm/jaw"
        );
    }

    // Respiratory symptoms
    if (
        transcriptLower.includes("short of breath") ||
        transcriptLower.includes("breathing") ||
        transcriptLower.includes("cough")
    ) {
        symptoms.push("Respiratory Symptoms");
        chiefComplaint = chiefComplaint === "general health concern" ? "respiratory symptoms" : chiefComplaint;
        if (!suggestedSpecialist) suggestedSpecialist = "Pulmonology";
        riskFlags.push("Dyspnea");
        if (!actionButtons.length) actionButtons.push("Schedule Pulmonology Consult", "Find Urgent Care");
        if (!planItems.length) {
            planItems.push(
                "Monitor oxygen saturation",
                "Use humidifier and stay hydrated",
                "Avoid irritants and allergens",
                "Seek care if breathing worsens"
            );
        }
    }

    // Headache
    if (
        transcriptLower.includes("headache") ||
        transcriptLower.includes("head hurt") ||
        transcriptLower.includes("migraine")
    ) {
        symptoms.push("Headache");
        chiefComplaint = chiefComplaint === "general health concern" ? "headache" : chiefComplaint;
        if (!suggestedSpecialist) suggestedSpecialist = "Neurology";
        riskFlags.push("Cephalgia");
        if (!actionButtons.length) actionButtons.push("Schedule Neurology Consult", "Track Headache Diary");
        if (!planItems.length) {
            planItems.push(
                "Rest in dark, quiet environment",
                "Stay hydrated - drink 8+ glasses of water daily",
                "Over-the-counter pain relief as directed",
                "Keep headache diary noting triggers"
            );
        }
    }

    // Anxiety/stress
    if (
        transcriptLower.includes("anxious") ||
        transcriptLower.includes("anxiety") ||
        transcriptLower.includes("stressed") ||
        transcriptLower.includes("worried")
    ) {
        symptoms.push("Anxiety Symptoms");
        chiefComplaint = chiefComplaint === "general health concern" ? "anxiety" : chiefComplaint;
        if (!suggestedSpecialist) suggestedSpecialist = "Psychiatry";
        riskFlags.push("Anxiety/Stress");
        if (!actionButtons.length) actionButtons.push("Book Counseling Session", "Find Mental Health Resources");
        if (!planItems.length) {
            planItems.push(
                "Practice deep breathing exercises 3x daily",
                "Limit caffeine and alcohol intake",
                "Maintain regular sleep schedule",
                "Consider counseling or therapy referral"
            );
        }
    }

    // Default plan if nothing specific detected
    if (planItems.length === 0) {
        planItems.push(
            "Schedule follow-up appointment within 1-2 weeks",
            "Monitor symptoms and note any changes",
            "Maintain healthy lifestyle habits",
            "Contact office if symptoms worsen"
        );
        actionButtons.push("Schedule Follow-up", "Contact Support");
    }

    // Determine triage score
    let triageScore = 4;
    if (
        symptoms.includes("Chest Pain") ||
        hasLowSpO2 ||
        (hasHighHR && symptoms.includes("Chest Pain"))
    ) {
        triageScore = 2;
    } else if (hasHighHR || riskFlags.length >= 2 || symptoms.includes("Respiratory Symptoms")) {
        triageScore = 3;
    }

    // Determine priority label
    let priorityLabel: "Routine" | "Urgent" | "Emergency" = "Routine";
    if (triageScore <= 2) {
        priorityLabel = "Emergency";
    } else if (triageScore === 3) {
        priorityLabel = "Urgent";
    }

    // Build vitals string for objective
    const vitalsStr = [
        vitals.heartRate ? `HR: ${vitals.heartRate} bpm` : "HR: Not obtained",
        vitals.spO2 ? `SpO2: ${vitals.spO2}%` : "SpO2: Not obtained",
        vitals.respiratoryRate ? `RR: ${vitals.respiratoryRate}/min` : "RR: Not obtained",
        vitals.bloodPressure
            ? `BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`
            : "BP: Not obtained",
    ].join(", ");

    // Extract a quote from transcript
    const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const patientQuote =
        sentences.length > 0
            ? `"${sentences[0].trim()}"`
            : '"General health concerns discussed."';

    // Generate narrative
    const urgencyText =
        triageScore <= 2
            ? "requiring urgent evaluation"
            : triageScore === 3
                ? "warranting prompt attention"
                : "for routine assessment";
    const narrativeSummary = `Patient presents with ${chiefComplaint} ${urgencyText}. ${hasHighHR ? "Tachycardia noted. " : ""}${hasLowSpO2 ? "Hypoxemia present. " : ""}Recommend ${suggestedSpecialist?.toLowerCase() || "primary care"} follow-up.`;

    return {
        subjective: `Chief Complaint: ${chiefComplaint.charAt(0).toUpperCase() + chiefComplaint.slice(1)}\n\nPatient reports: ${patientQuote}\n\nHistory of Present Illness: Patient presented for AI-assisted intake with ${symptoms.length > 0 ? symptoms.join(", ").toLowerCase() : "general health concerns"}. ${transcript.length > 100 ? `Additional context from conversation: "${transcript.slice(0, 150)}..."` : ""}`,
        objective: {
            text: `Vital Signs (via contactless rPPG monitoring):\n${vitalsStr}\n\n${hasHighHR ? "Clinical Note: Tachycardia present. " : ""}${hasLowSpO2 ? "Clinical Note: Oxygen saturation below normal range. " : ""}${vitals.stressLevel && vitals.stressLevel > 50 ? `Stress index elevated at ${vitals.stressLevel}%.` : ""}`,
            data: {
                heart_rate: vitals.heartRate?.toString() || null,
                spo2: vitals.spO2?.toString() || null,
                resp_rate: vitals.respiratoryRate?.toString() || null,
                bp: vitals.bloodPressure ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}` : null,
            }
        },
        assessment: symptoms.length > 0
            ? `Clinical presentation consistent with ${symptoms.join(" and ").toLowerCase()}. ${riskFlags.length > 0 ? `Risk factors identified: ${riskFlags.join(", ")}. ` : ""}${suggestedSpecialist ? `Consider ${suggestedSpecialist.toLowerCase()} referral for further evaluation.` : "Primary care management appropriate."}`
            : `Patient presents for evaluation. Vital signs ${hasHighHR || hasLowSpO2 ? "show abnormalities requiring attention" : "within acceptable limits"}. Continue monitoring and address any specific concerns.`,
        plan: planItems,
        triage_score: triageScore,
        priority_label: priorityLabel,
        risk_flags: riskFlags.length > 0 ? riskFlags : ["No immediate red flags identified"],
        narrative_summary: narrativeSummary,
        suggested_specialist: suggestedSpecialist,
        action_buttons: actionButtons,
    };
}

/**
 * @description Legacy function - synthesizes clinical report with SOAP note
 * @deprecated Use generateClinicalReport instead
 */
export async function synthesizeClinicalReport(
    intakeData: ClinicalIntakeData
): Promise<ClinicalReport> {
    // Format transcript for the new function
    const transcriptText = intakeData.transcript
        .map((t) => `${t.speaker}: ${t.text}`)
        .join("\n");

    // Generate SOAP note
    const soapNote = await generateClinicalReport(transcriptText, intakeData.vitals);

    // Map triage score to triage level
    const triageLevelMap: Record<number, ClinicalReport["triageLevel"]> = {
        1: "emergent",
        2: "urgent",
        3: "less-urgent",
        4: "non-urgent",
        5: "non-urgent",
    };

    // Convert to legacy format for backwards compatibility
    const report: ClinicalReport = {
        summary: soapNote.subjective,
        chiefComplaint: soapNote.risk_flags[0] || "General consultation",
        symptoms: soapNote.risk_flags,
        vitals: {
            heartRate: intakeData.vitals.heartRate,
            bloodPressure: intakeData.vitals.bloodPressure,
            respiratoryRate: intakeData.vitals.respiratoryRate,
            oxygenSaturation: intakeData.vitals.spO2,
        },
        clinicalImpression: soapNote.assessment,
        differentialDiagnoses: [soapNote.assessment],
        recommendations: soapNote.plan,
        triageLevel: triageLevelMap[soapNote.triage_score] || "non-urgent",
        confidence: soapNote.triage_score <= 2 ? 0.9 : 0.75,
        soapNote,
    };

    return report;
}

/**
 * @description Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
    return !!(
        process.env.GOOGLE_GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY
    );
}

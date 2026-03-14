import { SYMPTOM_DATABASE, SymptomPattern } from "./symptom-database.ts";

interface TriageResult {
  care_type: "urgent_care" | "er" | "critical";
  severity: "low" | "moderate" | "high" | "critical";
  recommendation: string;
}

/**
 * Normalizes text for symptom matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, " ")
    // Remove punctuation except spaces
    .replace(/[^\w\s]/g, "");
}

/**
 * Calculates match score for a symptom pattern
 * Returns the number of matching keywords
 */
function calculateMatchScore(transcript: string, pattern: SymptomPattern): number {
  if (pattern.keywords.length === 0) {
    return 0; // Default pattern
  }

  const normalizedTranscript = normalizeText(transcript);
  let matchCount = 0;

  for (const keyword of pattern.keywords) {
    const normalizedKeyword = normalizeText(keyword);

    // Check for exact phrase match
    if (normalizedTranscript.includes(normalizedKeyword)) {
      matchCount++;
      continue;
    }

    // Check for partial word matches (all words in keyword present)
    const keywordWords = normalizedKeyword.split(" ");
    const allWordsPresent = keywordWords.every(word =>
      normalizedTranscript.includes(word)
    );

    if (allWordsPresent) {
      matchCount += 0.5; // Partial match worth less
    }
  }

  return matchCount;
}

/**
 * Performs rule-based triage using symptom database
 * This is the fallback when AI is unavailable
 */
export function performRuleBasedTriage(transcript: string): TriageResult {
  console.log("Performing rule-based triage (AI unavailable)");

  if (!transcript || transcript.trim().length === 0) {
    // Return default urgent care recommendation
    const defaultPattern = SYMPTOM_DATABASE.find(p => p.keywords.length === 0);
    if (defaultPattern) {
      return {
        care_type: defaultPattern.care_type,
        severity: defaultPattern.severity,
        recommendation: defaultPattern.recommendation,
      };
    }
  }

  // Find all matching patterns
  const matches: Array<{ pattern: SymptomPattern; score: number }> = [];

  for (const pattern of SYMPTOM_DATABASE) {
    if (pattern.keywords.length === 0) continue; // Skip default pattern for now

    const score = calculateMatchScore(transcript, pattern);
    if (score > 0) {
      matches.push({ pattern, score });
    }
  }

  // Sort by score (descending), then by priority (descending)
  matches.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // Higher score first
    }
    return b.pattern.priority - a.pattern.priority; // Higher priority first
  });

  // Return the best match
  if (matches.length > 0) {
    const bestMatch = matches[0].pattern;
    console.log(`Rule-based triage: matched "${bestMatch.keywords[0]}" with score ${matches[0].score}`);

    return {
      care_type: bestMatch.care_type,
      severity: bestMatch.severity,
      recommendation: bestMatch.recommendation,
    };
  }

  // No matches found, return default
  console.log("No symptom matches found, using default urgent care recommendation");
  const defaultPattern = SYMPTOM_DATABASE.find(p => p.keywords.length === 0);

  return {
    care_type: defaultPattern?.care_type ?? "urgent_care",
    severity: defaultPattern?.severity ?? "moderate",
    recommendation: defaultPattern?.recommendation ??
      "Based on your symptoms, we recommend visiting an urgent care clinic for evaluation.",
  };
}

/**
 * Validates that a triage result has all required fields with valid values
 */
export function isValidTriageResult(result: unknown): result is TriageResult {
  if (!result || typeof result !== "object") return false;

  const r = result as Record<string, unknown>;

  const validCareTypes = new Set(["urgent_care", "er", "critical"]);
  const validSeverities = new Set(["low", "moderate", "high", "critical"]);

  return (
    typeof r.care_type === "string" &&
    validCareTypes.has(r.care_type) &&
    typeof r.severity === "string" &&
    validSeverities.has(r.severity) &&
    typeof r.recommendation === "string" &&
    r.recommendation.trim().length > 0
  );
}

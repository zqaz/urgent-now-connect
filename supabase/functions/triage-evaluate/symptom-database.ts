/**
 * Static symptom database for rule-based triage fallback
 * Used when AI is unavailable to provide reliable medical triage
 */

export interface SymptomPattern {
  keywords: string[];
  care_type: "urgent_care" | "er" | "critical";
  severity: "low" | "moderate" | "high" | "critical";
  recommendation: string;
  priority: number; // Higher priority wins when multiple matches
}

export const SYMPTOM_DATABASE: SymptomPattern[] = [
  // CRITICAL - Life-threatening (Priority 100+)
  {
    keywords: ["heart attack", "chest pain radiating", "crushing chest", "arm numbness chest"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. You may be experiencing a heart attack. Do not drive yourself.",
    priority: 100,
  },
  {
    keywords: ["can't breathe", "cannot breathe", "unable to breathe", "choking", "severe shortness of breath"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. Severe breathing difficulty requires emergency intervention.",
    priority: 100,
  },
  {
    keywords: ["stroke", "face drooping", "arm weakness", "speech difficulty", "slurred speech sudden"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. These are signs of a stroke. Time is critical for treatment.",
    priority: 100,
  },
  {
    keywords: ["uncontrolled bleeding", "heavy bleeding won't stop", "bleeding profusely", "arterial bleeding"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. Apply pressure to the wound and seek emergency help.",
    priority: 100,
  },
  {
    keywords: ["unconscious", "loss of consciousness", "passed out", "unresponsive"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. Loss of consciousness requires immediate medical evaluation.",
    priority: 100,
  },
  {
    keywords: ["seizure", "convulsion", "convulsing"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. Seizures require emergency medical attention.",
    priority: 100,
  },
  {
    keywords: ["severe allergic reaction", "anaphylaxis", "throat swelling", "tongue swelling"],
    care_type: "critical",
    severity: "critical",
    recommendation: "Call 911 immediately. Use EpiPen if available. This is a life-threatening allergic reaction.",
    priority: 100,
  },

  // EMERGENCY ROOM - Serious but stable (Priority 50-99)
  {
    keywords: ["chest pain", "chest tightness", "chest pressure"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER immediately. Chest pain should be evaluated urgently to rule out cardiac issues.",
    priority: 90,
  },
  {
    keywords: ["difficulty breathing", "shortness of breath", "trouble breathing", "hard to breathe"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER. Breathing difficulties need immediate medical evaluation.",
    priority: 85,
  },
  {
    keywords: ["severe bleeding", "deep cut", "cut won't stop bleeding", "severe laceration"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER for severe bleeding or deep wounds that may need stitches or surgical repair.",
    priority: 80,
  },
  {
    keywords: ["head injury", "head trauma", "hit head", "concussion"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER. Head injuries require medical evaluation to rule out serious complications.",
    priority: 80,
  },
  {
    keywords: ["broken bone", "bone sticking out", "deformed limb", "severe fracture"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER for severe fractures, especially if bone is visible or limb appears deformed.",
    priority: 75,
  },
  {
    keywords: ["severe abdominal pain", "acute abdomen", "stabbing stomach pain"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER. Severe abdominal pain may indicate a serious condition requiring urgent evaluation.",
    priority: 70,
  },
  {
    keywords: ["high fever", "fever over 103", "fever with confusion", "fever with stiff neck"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER. Very high fever or fever with concerning symptoms requires urgent care.",
    priority: 65,
  },
  {
    keywords: ["severe burn", "large burn", "third degree burn", "chemical burn"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER for severe, large, or chemical burns requiring specialized treatment.",
    priority: 65,
  },
  {
    keywords: ["sudden vision loss", "sudden blindness", "eye injury severe"],
    care_type: "er",
    severity: "high",
    recommendation: "Visit the ER immediately. Sudden vision changes or severe eye injuries need urgent evaluation.",
    priority: 60,
  },

  // URGENT CARE - Needs attention but not life-threatening (Priority 10-49)
  {
    keywords: ["sprain", "twisted ankle", "rolled ankle", "sprained wrist"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for evaluation and treatment of sprains. Apply ice and elevate until seen.",
    priority: 40,
  },
  {
    keywords: ["cut", "laceration", "gash", "needs stitches"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care. Cuts that may need stitches should be evaluated within a few hours.",
    priority: 40,
  },
  {
    keywords: ["fever", "high temperature", "running a fever"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for persistent or concerning fever. Monitor temperature and stay hydrated.",
    priority: 35,
  },
  {
    keywords: ["ear pain", "earache", "ear infection"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care. Ear infections and severe ear pain should be evaluated and treated.",
    priority: 30,
  },
  {
    keywords: ["uti", "urinary tract infection", "painful urination", "burning urination"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care. UTI symptoms should be treated promptly to prevent complications.",
    priority: 30,
  },
  {
    keywords: ["sore throat", "strep throat", "throat pain"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care. Severe sore throat may be strep and should be tested and treated.",
    priority: 25,
  },
  {
    keywords: ["rash", "skin rash", "itchy rash", "allergic rash"],
    care_type: "urgent_care",
    severity: "low",
    recommendation: "Visit urgent care if the rash is severe, spreading, or accompanied by other symptoms.",
    priority: 20,
  },
  {
    keywords: ["cough", "persistent cough", "bad cough"],
    care_type: "urgent_care",
    severity: "low",
    recommendation: "Visit urgent care for persistent or severe cough that interferes with daily activities.",
    priority: 20,
  },
  {
    keywords: ["vomiting", "throwing up", "nausea vomiting"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for persistent vomiting to prevent dehydration and address underlying cause.",
    priority: 30,
  },
  {
    keywords: ["diarrhea", "severe diarrhea", "bloody stool"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for severe or bloody diarrhea to prevent dehydration and treat infection.",
    priority: 30,
  },
  {
    keywords: ["minor burn", "small burn", "first degree burn"],
    care_type: "urgent_care",
    severity: "low",
    recommendation: "Visit urgent care for burn evaluation and treatment. Run cool water over the area.",
    priority: 25,
  },
  {
    keywords: ["back pain", "severe back pain"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for severe or sudden back pain that limits mobility.",
    priority: 25,
  },
  {
    keywords: ["allergic reaction", "allergic", "hives", "swelling"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for allergic reactions with hives or swelling. If breathing affected, call 911.",
    priority: 35,
  },
  {
    keywords: ["migraine", "severe headache", "bad headache"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for severe headaches, especially if different from usual or with other symptoms.",
    priority: 25,
  },
  {
    keywords: ["infection", "infected wound", "wound infection", "red and swollen"],
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Visit urgent care for signs of infection including redness, swelling, warmth, or pus.",
    priority: 35,
  },

  // Default fallback (Priority 0)
  {
    keywords: [], // Empty keywords means this is the default
    care_type: "urgent_care",
    severity: "moderate",
    recommendation: "Based on your symptoms, we recommend visiting an urgent care clinic for evaluation.",
    priority: 0,
  },
];

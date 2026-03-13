export interface FirstAidTip {
  id: string;
  title: string;
  icon: string;
  summary: string;
  steps: string[];
  warning?: string;
}

export const firstAidTips: FirstAidTip[] = [
  {
    id: "cpr",
    title: "CPR (Cardiopulmonary Resuscitation)",
    icon: "Heart",
    summary: "When someone's heart stops beating or they stop breathing.",
    steps: [
      "Call 911 immediately or have someone else call.",
      "Place the person on their back on a firm, flat surface.",
      "Kneel beside them and place the heel of one hand on the center of the chest.",
      "Place your other hand on top, interlocking your fingers.",
      "Push hard and fast — at least 2 inches deep, at a rate of 100–120 compressions per minute.",
      "If trained, give 2 rescue breaths after every 30 compressions.",
      "Continue until emergency help arrives or the person starts breathing.",
    ],
    warning: "Only perform rescue breaths if you are trained. Hands-only CPR is effective and recommended for untrained bystanders.",
  },
  {
    id: "choking",
    title: "Choking",
    icon: "Wind",
    summary: "When someone cannot breathe because something is blocking their airway.",
    steps: [
      "Ask the person if they are choking. If they cannot speak, cough, or breathe, act immediately.",
      "Stand behind the person and wrap your arms around their waist.",
      "Make a fist with one hand and place it just above the belly button.",
      "Grasp your fist with your other hand.",
      "Perform quick, upward thrusts (Heimlich maneuver).",
      "Repeat until the object is dislodged or the person can breathe.",
      "If the person becomes unconscious, lower them to the ground and begin CPR.",
    ],
  },
  {
    id: "bleeding",
    title: "Severe Bleeding",
    icon: "Droplets",
    summary: "When someone is bleeding heavily from a wound.",
    steps: [
      "Call 911 if the bleeding is severe.",
      "Put on gloves if available to protect yourself.",
      "Apply firm, direct pressure to the wound using a clean cloth or bandage.",
      "Do NOT remove the cloth if it becomes soaked — add more layers on top.",
      "If possible, elevate the injured area above the heart.",
      "Keep applying pressure until help arrives.",
      "If bleeding is from a limb and won't stop, a tourniquet may be needed — apply 2–3 inches above the wound.",
    ],
    warning: "Do not apply a tourniquet unless you are trained or the bleeding is life-threatening and cannot be controlled with pressure.",
  },
  {
    id: "burns",
    title: "Burns",
    icon: "Flame",
    summary: "When skin is damaged by heat, chemicals, or electricity.",
    steps: [
      "Remove the person from the source of the burn.",
      "Cool the burn under cool (not cold) running water for at least 10 minutes.",
      "Remove any clothing or jewelry near the burn, unless stuck to the skin.",
      "Cover the burn loosely with a sterile, non-stick bandage.",
      "Do NOT apply ice, butter, or ointments to the burn.",
      "For severe burns (blistering, charring, or larger than 3 inches), call 911.",
      "Give over-the-counter pain relief if needed and the person is conscious.",
    ],
  },
  {
    id: "allergic",
    title: "Severe Allergic Reaction (Anaphylaxis)",
    icon: "AlertTriangle",
    summary: "A life-threatening reaction to food, stings, or medication.",
    steps: [
      "Call 911 immediately.",
      "Ask the person if they have an epinephrine auto-injector (EpiPen).",
      "Help them use the EpiPen — inject into the outer thigh, even through clothing.",
      "Have the person lie down with their legs elevated, unless they have difficulty breathing.",
      "If breathing is difficult, let them sit up slightly.",
      "Loosen any tight clothing.",
      "Monitor breathing and be prepared to perform CPR if they stop breathing.",
      "A second dose of epinephrine may be given after 5–15 minutes if symptoms don't improve.",
    ],
    warning: "Even if symptoms improve after epinephrine, the person still needs emergency medical care. Always call 911.",
  },
  {
    id: "seizure",
    title: "Seizures",
    icon: "Zap",
    summary: "When someone has uncontrolled muscle movements or loses consciousness.",
    steps: [
      "Stay calm and time the seizure.",
      "Clear the area of any hard or sharp objects.",
      "Place something soft under their head if possible.",
      "Turn the person gently onto their side (recovery position).",
      "Do NOT hold the person down or try to stop their movements.",
      "Do NOT put anything in their mouth.",
      "Stay with them until the seizure ends and they are fully conscious.",
      "Call 911 if the seizure lasts longer than 5 minutes, or if it's their first seizure.",
    ],
  },
];

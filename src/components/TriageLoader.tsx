import { Activity, MapPin, Clock, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface TriageLoaderProps {
  onComplete: () => void;
}

const steps = [
  "Processing audio transcript...",
  "Analyzing symptom patterns...",
  "Cross-referencing medical protocols...",
  "Locating nearby urgent care...",
  "Generating triage recommendation...",
];

const finalizingMessages = [
  "Hang tight, we're getting your best urgent care options…",
  "Almost there — finding the shortest wait times nearby…",
  "Pulling live availability from clinics in your area…",
  "Ranking options by distance and wait time…",
];

const TriageLoader = ({ onComplete }: TriageLoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [finalMsgIndex, setFinalMsgIndex] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const newStep = Math.min(Math.floor(progress / 20), steps.length - 1);
    setStepIndex(newStep);
    if (progress >= 100 && !isFinalizing) {
      setIsFinalizing(true);
    }
  }, [progress, isFinalizing]);

  // Cycle through finalizing messages once progress hits 100
  useEffect(() => {
    if (!isFinalizing) return;
    const interval = setInterval(() => {
      setFinalMsgIndex((prev) => (prev + 1) % finalizingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isFinalizing]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-6">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground text-center mb-1 tracking-tight">
          {isFinalizing ? "Finding Your Best Options" : "Triage Analysis"}
        </h2>
        <p className="text-muted-foreground text-center text-sm mb-8">
          {isFinalizing
            ? "Comparing wait times and distances near you"
            : "Evaluating your symptoms"}
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step / finalizing label */}
        <p className="text-xs text-muted-foreground text-center transition-opacity duration-300 min-h-[1.25rem]">
          {isFinalizing ? finalizingMessages[finalMsgIndex] : steps[stepIndex]}
        </p>

        {/* Percentage or spinner dots */}
        {isFinalizing ? (
          <div className="flex justify-center gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <p className="text-2xl font-bold text-foreground text-center mt-6 tabular-nums">
            {progress}%
          </p>
        )}

        {/* Reassurance pills — shown only while finalizing */}
        {isFinalizing && (
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[
              { icon: <MapPin className="w-3 h-3" />, label: "Nearby clinics" },
              { icon: <Clock className="w-3 h-3" />, label: "Live wait times" },
              { icon: <Shield className="w-3 h-3" />, label: "Triage complete" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


export default TriageLoader;


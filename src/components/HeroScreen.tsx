import { useState, useRef, useCallback } from "react";
import { Mic, Activity, MicOff, ShieldCheck, MessageCircle, Send } from "lucide-react";
import { MicPermission } from "@/hooks/useSpeechRecognition";

interface HeroScreenProps {
  onStartRecording: () => void;
  isRecording: boolean;
  onStopRecording: () => void;
  transcript?: string;
  micPermission: MicPermission;
  onRequestMicPermission: () => Promise<void>;
  onSubmitText?: (text: string) => void;
}

const WaveformBar = ({ delay }: { delay: string }) => (
  <div
    className="w-1 rounded-full bg-primary-foreground/80 animate-waveform"
    style={{ animationDelay: delay, height: "8px" }}
  />
);

const HeroScreen = ({
  onStartRecording,
  isRecording,
  onStopRecording,
  transcript,
  micPermission,
  onRequestMicPermission,
  onSubmitText,
}: HeroScreenProps) => {
  const [chatInput, setChatInput] = useState("");
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const holdStartedRef = useRef(false);

  const handleSubmitText = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed || !onSubmitText) return;
    onSubmitText(trimmed);
    setChatInput("");
  }, [chatInput, onSubmitText]);

  const handlePointerDown = useCallback(() => {
    if (micPermission === "denied") return;
    if (isRecording) return; // tap-to-stop handled by onClick

    isHoldingRef.current = false;
    holdStartedRef.current = false;

    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      holdStartedRef.current = true;
      onStartRecording();
    }, 200); // small delay distinguishes hold from tap
  }, [isRecording, micPermission, onStartRecording]);

  const handlePointerUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldingRef.current && holdStartedRef.current) {
      // Was holding — release stops recording
      isHoldingRef.current = false;
      holdStartedRef.current = false;
      onStopRecording();
    }
    // If it wasn't a hold, the click event will handle tap logic
  }, [onStopRecording]);

  const handleClick = useCallback(() => {
    if (micPermission === "denied") return;

    // If a hold just finished, ignore the click (already handled)
    if (holdStartedRef.current) {
      holdStartedRef.current = false;
      return;
    }

    // Tap toggle
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  }, [isRecording, micPermission, onStartRecording, onStopRecording]);

  const needsPermission = micPermission === "denied" || micPermission === "prompt";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-6">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-5 h-5 text-alert-red" />
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          UrgentNow
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-2 tracking-tight">
        How can we help?
      </h1>
      <p className="text-muted-foreground text-center max-w-sm mb-12 text-sm leading-relaxed">
        Tap or hold the microphone and describe your symptoms. We'll find the
        fastest care near you.
      </p>

      {/* Mic Permission Banner */}
      {micPermission === "denied" && (
        <div className="mb-6 w-full max-w-sm rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3">
          <MicOff className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Microphone access blocked
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Please allow microphone access in your browser settings, then
              refresh the page.
            </p>
          </div>
        </div>
      )}

      {micPermission === "prompt" && (
        <div className="mb-6 w-full max-w-sm rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              Microphone access is needed to describe your symptoms.
            </p>
          </div>
          <button
            onClick={onRequestMicPermission}
            className="text-xs font-semibold text-primary shrink-0 underline underline-offset-2"
          >
            Allow
          </button>
        </div>
      )}

      {/* Mic Button */}
      <div className="relative mb-4">
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-alert-red/20 animate-pulse-ring" />
            <div
              className="absolute inset-0 rounded-full bg-alert-red/10 animate-pulse-ring"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}
        {!isRecording && (
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring" />
        )}

        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleClick}
          disabled={micPermission === "denied"}
          className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 select-none touch-none ${
            micPermission === "denied"
              ? "bg-muted cursor-not-allowed opacity-50"
              : isRecording
              ? "bg-alert-red shadow-[0_0_40px_hsl(var(--alert-red)/0.4)] cursor-pointer"
              : "bg-primary shadow-[0_8px_32px_hsl(var(--navy)/0.3)] hover:shadow-[0_8px_40px_hsl(var(--navy)/0.45)] hover:scale-105 cursor-pointer"
          }`}
        >
          {micPermission === "denied" ? (
            <MicOff className="w-8 h-8 text-muted-foreground" />
          ) : isRecording ? (
            <div className="flex items-end gap-[3px] h-8">
              {[...Array(5)].map((_, i) => (
                <WaveformBar key={i} delay={`${i * 0.12}s`} />
              ))}
            </div>
          ) : (
            <Mic className="w-8 h-8 text-primary-foreground" />
          )}
        </button>
      </div>

      <span className="text-sm font-medium text-foreground">
        {micPermission === "denied"
          ? "Microphone blocked"
          : isRecording
          ? "Listening… tap or release to stop"
          : "Tap or hold to record"}
      </span>

      {/* Hold hint */}
      {!isRecording && micPermission !== "denied" && (
        <p className="text-xs text-muted-foreground mt-1">
          Hold for hands-free · Tap to toggle
        </p>
      )}

      {/* Live transcript */}
      {isRecording && transcript && (
        <div className="mt-6 max-w-md text-center">
          <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
        </div>
      )}

      {/* Chat — type symptoms instead of speaking */}
      <div className="mt-8 w-full max-w-sm">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          Or type your symptoms
        </p>
        <div className="flex gap-2 rounded-xl border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitText();
              }
            }}
            placeholder="e.g. sore throat and fever for 2 days"
            rows={2}
            className="flex-1 min-h-[52px] resize-none border-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleSubmitText}
            disabled={!chatInput.trim() || !onSubmitText}
            className="self-end mb-2 mr-2 flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Disclosure footer */}
      <div className="flex flex-col items-center gap-2 mt-14">
        {/* HIPAA badge */}
        <div className="flex items-center gap-1.5 bg-safe-green/10 border border-safe-green/30 text-safe-green text-[11px] font-semibold px-3 py-1 rounded-full mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          HIPAA Compliant
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>End-to-End Encrypted</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span>AI-Powered Triage</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span>24/7</span>
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center max-w-xs leading-relaxed">
          For informational purposes only. Not a substitute for professional medical advice.
          In a life-threatening emergency, call 911 immediately.
        </p>
      </div>
    </div>
  );
};

export default HeroScreen;

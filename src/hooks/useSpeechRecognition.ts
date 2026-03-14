import { useRef, useState, useCallback, useEffect } from "react";

export type MicPermission = "unknown" | "granted" | "denied" | "prompt";

interface UseSpeechRecognitionReturn {
  isRecording: boolean;
  transcript: string;
  micPermission: MicPermission;
  requestMicPermission: () => Promise<void>;
  startListening: () => void;
  stopListening: () => Promise<string>;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  const recognitionRef = useRef<any>(null);
  const resolveRef = useRef<((text: string) => void) | null>(null);
  const fullTranscriptRef = useRef("");

  // Check mic permission on mount
  useEffect(() => {
    if (!navigator.permissions) {
      setMicPermission("unknown");
      return;
    }
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((result) => {
        setMicPermission(result.state as MicPermission);
        result.onchange = () => setMicPermission(result.state as MicPermission);
      })
      .catch(() => setMicPermission("unknown"));
  }, []);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately — we just needed the permission
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
    }
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    fullTranscriptRef.current = "";
    setTranscript("");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      fullTranscriptRef.current = final;
      setTranscript(final + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setMicPermission("denied");
      }
      setIsRecording(false);
      resolveRef.current?.(fullTranscriptRef.current);
      resolveRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      resolveRef.current?.(fullTranscriptRef.current);
      resolveRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      recognitionRef.current?.stop();
    });
  }, []);

  return {
    isRecording,
    transcript,
    micPermission,
    requestMicPermission,
    startListening,
    stopListening,
  };
}

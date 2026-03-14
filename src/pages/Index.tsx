import { useState, useCallback, useRef, useEffect } from "react";
import { AppState, TriageResult, Clinic } from "@/data/types";
import { mockClinics } from "@/data/mockClinics";
import { mockERs } from "@/data/mockERs";
import HeroScreen from "@/components/HeroScreen";
import TranscriptConfirm from "@/components/TranscriptConfirm";
import TriageLoader from "@/components/TriageLoader";
import InsuranceSelect from "@/components/InsuranceSelect";
import Dashboard from "@/components/Dashboard";
import ERDashboard from "@/components/ERDashboard";
import EmergencyFooter from "@/components/EmergencyFooter";
import CriticalAlert from "@/components/CriticalAlert";
import LocationPrompt from "@/components/LocationPrompt";
import HistoryPanel from "@/components/HistoryPanel";
import AuthModal from "@/components/AuthModal";
import ProfileModal from "@/components/ProfileModal";
import ProfileButton from "@/components/ProfileButton";
import PrivacyNotice from "@/components/PrivacyNotice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useHistory } from "@/hooks/useHistory";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { distanceMiles, DEFAULT_RADIUS_MILES } from "@/lib/geo";

const PRIVACY_ACK_KEY = "un_privacy_ack";

const DEFAULT_LOCATION = { lat: 47.6062, lng: -122.3321 };

function enrichAndFilter(
  clinics: Clinic[],
  userLoc: { lat: number; lng: number },
  radiusMiles: number
): Clinic[] {
  return clinics
    .map((c) => ({
      ...c,
      distance_miles: distanceMiles(userLoc.lat, userLoc.lng, c.coordinates.lat, c.coordinates.lng),
    }))
    .filter((c) => c.distance_miles <= radiusMiles);
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>("hero");
  const [showCriticalOverlay, setShowCriticalOverlay] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [confirmedTranscript, setConfirmedTranscript] = useState("");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isFetchingClinics, setIsFetchingClinics] = useState(false);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [locationRequesting, setLocationRequesting] = useState(false);
  const [locationError, setLocationError] = useState<string>();
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  const [insuranceContinuing, setInsuranceContinuing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(
    () => !sessionStorage.getItem(PRIVACY_ACK_KEY)
  );

  const pendingCareTypeRef = useRef<string>("urgent_care");
  const watchIdRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef("");

  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, saving, isLocalMode, upsertProfile } = useProfile(user);
  const { isRecording, transcript, micPermission, requestMicPermission, startListening, stopListening } = useSpeechRecognition();
  const { history, addEntry, recordNavigate, clearHistory } = useHistory();

  // Live location watching
  useEffect(() => {
    if (!hasRealLocation || !("geolocation" in navigator)) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation((prev) =>
          prev.lat === lat && prev.lng === lng ? prev : { lat, lng }
        );
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [hasRealLocation]);

  const handleLocationGranted = useCallback((coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
    setHasRealLocation(true);
    setShowLocationPrompt(false);
    setLocationRequesting(false);
  }, []);

  const handleLocationSkip = useCallback(() => {
    setShowLocationPrompt(false);
    setLocationRequesting(false);
  }, []);

  const fetchClinics = useCallback(async (careType: string) => {
    setIsFetchingClinics(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-clinics", {
        body: { lat: userLocation.lat, lng: userLocation.lng, care_type: careType },
      });
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const enriched = enrichAndFilter(data as Clinic[], userLocation, DEFAULT_RADIUS_MILES);
        setClinics(enriched.length > 0 ? enriched : enrichAndFilter(data as Clinic[], userLocation, 999));
        return;
      }
      throw new Error("Empty response");
    } catch (err) {
      // PHI (location) intentionally excluded from log output
      if (import.meta.env.DEV) console.error("fetch-clinics failed:", err);
      const fallback = careType === "urgent_care" ? mockClinics : mockERs;
      setClinics(enrichAndFilter(fallback, userLocation, DEFAULT_RADIUS_MILES));
    } finally {
      setIsFetchingClinics(false);
    }
  }, [userLocation]);

  const handleStartRecording = useCallback(() => {
    try {
      startListening();
      setAppState("recording");
    } catch {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support speech recognition. Please try Chrome or Edge.",
        variant: "destructive",
      });
    }
  }, [startListening, toast]);

  const handleStopRecording = useCallback(async () => {
    const text = await stopListening();
    lastTranscriptRef.current = text;
    if (!text.trim()) {
      toast({
        title: "No Speech Detected",
        description: "We didn't catch anything. Please try again.",
        variant: "destructive",
      });
      setAppState("hero");
      return;
    }
    setConfirmedTranscript(text);
    setAppState("confirm");
  }, [stopListening, toast]);

  const handleConfirmTranscript = useCallback((text: string) => {
    setConfirmedTranscript(text);
    setAppState("analyzing");
  }, []);

  const handleRetry = useCallback(() => {
    setConfirmedTranscript("");
    setAppState("hero");
  }, []);

  const handleSubmitText = useCallback((text: string) => {
    setConfirmedTranscript(text);
    setAppState("confirm");
  }, []);

  const handleNavigateClinic = useCallback((clinic: Clinic) => {
    if (currentEntryId) recordNavigate(currentEntryId, clinic);
  }, [currentEntryId, recordNavigate]);

  /** After triage completes: skip insurance picker if user has one saved in their profile */
  const handleAnalysisComplete = useCallback(async () => {
    try {
      if (!confirmedTranscript.trim()) throw new Error("No symptoms to evaluate.");

      const { data, error } = await supabase.functions.invoke("triage-evaluate", {
        body: { transcript: confirmedTranscript },
      });
      if (error) throw error;

      const result = data as TriageResult;
      setTriageResult(result);
      const entryId = addEntry(confirmedTranscript, result.care_type);
      setCurrentEntryId(entryId);
      pendingCareTypeRef.current = result.care_type;

      // Auto-skip insurance picker when user's profile has an insurance saved
      const savedInsurance = profile?.insurance_id ?? null;
      if (savedInsurance) {
        setSelectedInsurance(savedInsurance);
        await fetchClinics(result.care_type);
        if (result.care_type === "critical") {
          setShowCriticalOverlay(true);
          setAppState("er_dashboard");
        } else if (result.care_type === "er") {
          setAppState("er_dashboard");
        } else {
          setAppState("dashboard");
        }
      } else {
        setAppState("insurance_select");
      }
    } catch (err) {
      // PHI (symptom transcript) intentionally excluded from log output
      if (import.meta.env.DEV) console.error("Triage evaluation failed:", err);
      toast({
        title: "Evaluation Error",
        description:
          err instanceof Error
            ? err.message
            : "Could not evaluate symptoms. Showing urgent care options as a fallback.",
        variant: "destructive",
      });
      const entryId = addEntry(confirmedTranscript, "urgent_care");
      setCurrentEntryId(entryId);
      setTriageResult({
        care_type: "urgent_care",
        severity: "moderate",
        recommendation:
          "We couldn't complete the AI evaluation. Based on precaution, please visit an urgent care clinic.",
      });
      setClinics(enrichAndFilter(mockClinics, userLocation, DEFAULT_RADIUS_MILES));
      setAppState("dashboard");
    }
  }, [confirmedTranscript, toast, userLocation, addEntry, profile, fetchClinics]);

  const proceedWithInsurance = useCallback(async (insuranceId: string | null) => {
    setInsuranceContinuing(true);
    try {
      setSelectedInsurance(insuranceId);
      const careType = pendingCareTypeRef.current;
      await fetchClinics(careType);
      if (careType === "critical") {
        setShowCriticalOverlay(true);
        setAppState("er_dashboard");
      } else if (careType === "er") {
        setAppState("er_dashboard");
      } else {
        setAppState("dashboard");
      }
    } finally {
      setInsuranceContinuing(false);
    }
  }, [fetchClinics]);

  const handleInsuranceSelect = useCallback((id: string) => proceedWithInsurance(id), [proceedWithInsurance]);
  const handleInsuranceSkip = useCallback(() => proceedWithInsurance(null), [proceedWithInsurance]);

  const handleBack = useCallback(() => {
    setAppState("hero");
    setTriageResult(null);
    setConfirmedTranscript("");
    setClinics([]);
    setSelectedInsurance(null);
    pendingCareTypeRef.current = "urgent_care";
  }, []);

  const handlePrivacyAccept = useCallback(() => {
    sessionStorage.setItem(PRIVACY_ACK_KEY, "1");
    setShowPrivacyNotice(false);
  }, []);

  const handleSessionExpired = useCallback(async () => {
    await signOut();
    // Clear all in-memory PHI when session expires
    handleBack();
    toast({
      title: "Session Expired",
      description: "You have been signed out after 30 minutes of inactivity to protect your health information.",
      variant: "destructive",
    });
  }, [signOut, toast]);

  const handleSessionWarning = useCallback(() => {
    toast({
      title: "Session Expiring Soon",
      description: "Your session will expire in 5 minutes due to inactivity. Move your mouse or tap to stay signed in.",
    });
  }, [toast]);

  // HIPAA automatic logoff — 30-minute inactivity timeout for logged-in users
  useSessionTimeout({
    isActive: !!user,
    onTimeout: handleSessionExpired,
    onWarning: handleSessionWarning,
  });

  const handleProfileButtonClick = useCallback(() => {
    if (user) {
      setShowProfileModal(true);
    } else {
      setShowAuthModal(true);
    }
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setShowProfileModal(false);
    // Clear all in-memory PHI on explicit sign-out
    handleBack();
    setUserLocation(DEFAULT_LOCATION);
    setHasRealLocation(false);
  }, [signOut, handleBack]);

  const severity = triageResult?.severity ?? "moderate";
  const recommendation =
    triageResult?.recommendation ??
    "Based on your symptoms, we recommend visiting an urgent care clinic.";

  return (
    <div className="min-h-screen bg-background relative">
      {/* Privacy notice — shown once per session before any data collection begins */}
      {showPrivacyNotice && <PrivacyNotice onAccept={handlePrivacyAccept} />}

      {showLocationPrompt && (
        <LocationPrompt
          onGranted={handleLocationGranted}
          onSkip={handleLocationSkip}
          isRequesting={locationRequesting}
          error={locationError}
        />
      )}

      {/* Hero / Recording header — with profile button in top-right */}
      {(appState === "hero" || appState === "recording") && (
        <header className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto w-full">
          <div className="w-9" /> {/* spacer to balance profile button */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">U</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">UrgentNow</span>
          </div>
          <ProfileButton
            profile={profile}
            isLoggedIn={!!user}
            onClick={handleProfileButtonClick}
          />
        </header>
      )}

      {(appState === "hero" || appState === "recording") && (
        <HeroScreen
          onStartRecording={handleStartRecording}
          isRecording={isRecording}
          onStopRecording={handleStopRecording}
          transcript={transcript}
          micPermission={micPermission}
          onRequestMicPermission={requestMicPermission}
          onSubmitText={handleSubmitText}
        />
      )}

      {appState === "hero" && (
        <HistoryPanel history={history} onClear={clearHistory} />
      )}

      {appState === "confirm" && (
        <TranscriptConfirm
          transcript={confirmedTranscript}
          onConfirm={handleConfirmTranscript}
          onRetry={handleRetry}
        />
      )}

      {appState === "analyzing" && (
        <TriageLoader onComplete={handleAnalysisComplete} />
      )}

      {appState === "insurance_select" && (
        <InsuranceSelect
          onSelect={handleInsuranceSelect}
          onSkip={handleInsuranceSkip}
          loading={insuranceContinuing}
          profileButton={
            <ProfileButton
              profile={profile}
              isLoggedIn={!!user}
              onClick={handleProfileButtonClick}
            />
          }
        />
      )}

      {appState === "dashboard" && (
        <Dashboard
          clinics={clinics.length > 0 ? clinics : enrichAndFilter(mockClinics, userLocation, DEFAULT_RADIUS_MILES)}
          severity={severity}
          recommendation={recommendation}
          onBack={handleBack}
          isLoading={isFetchingClinics}
          userLocation={userLocation}
          onNavigate={handleNavigateClinic}
          selectedInsurance={selectedInsurance}
          profileButton={
            <ProfileButton
              profile={profile}
              isLoggedIn={!!user}
              onClick={handleProfileButtonClick}
            />
          }
        />
      )}

      {appState === "er_dashboard" && (
        <ERDashboard
          ers={clinics.length > 0 ? clinics : enrichAndFilter(mockERs, userLocation, DEFAULT_RADIUS_MILES)}
          severity={severity}
          recommendation={recommendation}
          onBack={handleBack}
          isLoading={isFetchingClinics}
          userLocation={userLocation}
          onNavigate={handleNavigateClinic}
          selectedInsurance={selectedInsurance}
          profileButton={
            <ProfileButton
              profile={profile}
              isLoggedIn={!!user}
              onClick={handleProfileButtonClick}
            />
          }
        />
      )}

      {showCriticalOverlay && (
        <CriticalAlert onDismiss={() => setShowCriticalOverlay(false)} />
      )}

      <EmergencyFooter isCritical={appState === "er_dashboard" || showCriticalOverlay} />

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // "Set Up My Profile" in the welcome screen goes straight to the profile modal
            setShowProfileModal(true);
          }}
        />
      )}

      {/* Profile modal */}
      {showProfileModal && user && (
        <ProfileModal
          profile={profile}
          userEmail={user.email}
          saving={saving}
          isLocalMode={isLocalMode}
          onSave={upsertProfile}
          onSignOut={handleSignOut}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default Index;

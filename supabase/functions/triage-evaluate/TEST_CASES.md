# Triage Evaluation Test Cases

## How to Test

### Local Testing (Supabase CLI)
```bash
# Start local Supabase functions
npx supabase functions serve triage-evaluate

# Test with curl
curl -X POST http://localhost:54321/functions/v1/triage-evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"transcript": "I have chest pain"}'
```

### Test Cases

#### Critical Cases (Should return care_type: "critical")

1. **Heart Attack**
```json
{"transcript": "I have severe chest pain radiating to my left arm"}
```
Expected: `care_type: "critical", severity: "critical"`

2. **Stroke**
```json
{"transcript": "My face is drooping and I can't speak clearly"}
```
Expected: `care_type: "critical", severity: "critical"`

3. **Cannot Breathe**
```json
{"transcript": "I can't breathe at all"}
```
Expected: `care_type: "critical", severity: "critical"`

4. **Severe Bleeding**
```json
{"transcript": "I have heavy bleeding that won't stop"}
```
Expected: `care_type: "critical", severity: "critical"`

#### ER Cases (Should return care_type: "er")

1. **Chest Pain**
```json
{"transcript": "I have chest pain and pressure"}
```
Expected: `care_type: "er", severity: "high"`

2. **Difficulty Breathing**
```json
{"transcript": "I'm having difficulty breathing"}
```
Expected: `care_type: "er", severity: "high"`

3. **Head Injury**
```json
{"transcript": "I hit my head and feel dizzy"}
```
Expected: `care_type: "er", severity: "high"`

4. **Severe Burn**
```json
{"transcript": "I have a large burn on my arm"}
```
Expected: `care_type: "er", severity: "high"`

#### Urgent Care Cases (Should return care_type: "urgent_care")

1. **Sprain**
```json
{"transcript": "I twisted my ankle and it's swollen"}
```
Expected: `care_type: "urgent_care", severity: "moderate"`

2. **Fever**
```json
{"transcript": "I have a fever and sore throat"}
```
Expected: `care_type: "urgent_care", severity: "moderate"`

3. **UTI**
```json
{"transcript": "Painful urination and frequent need to go"}
```
Expected: `care_type: "urgent_care", severity: "moderate"`

4. **Ear Infection**
```json
{"transcript": "My ear really hurts"}
```
Expected: `care_type: "urgent_care", severity: "moderate"`

5. **Rash**
```json
{"transcript": "I have an itchy rash on my arm"}
```
Expected: `care_type: "urgent_care", severity: "low"`

#### Edge Cases

1. **Empty Transcript**
```json
{"transcript": ""}
```
Expected: Default urgent care recommendation

2. **Vague Symptoms**
```json
{"transcript": "I don't feel well"}
```
Expected: `care_type: "urgent_care", severity: "moderate"` (default)

3. **Multiple Symptoms (Critical + Non-Critical)**
```json
{"transcript": "I have a headache and chest pain"}
```
Expected: `care_type: "er", severity: "high"` (critical symptoms take priority)

## Expected Behavior

### With AI Available (Gemini API Key Set)
1. System attempts AI-based triage first
2. Returns AI result if successful
3. Falls back to rule-based if AI fails

### Without AI (No API Key)
1. System uses rule-based triage immediately
2. Matches symptoms against database
3. Returns appropriate care type and severity

### Catastrophic Failure
1. Even if everything fails, returns safe default
2. Always returns HTTP 200 (not 500)
3. Default: urgent care, moderate severity

## Success Criteria

✓ AI authentication works correctly (no 401/403 errors)
✓ Rule-based fallback triggers when AI unavailable
✓ Critical symptoms correctly identified
✓ ER symptoms correctly identified
✓ Urgent care symptoms correctly identified
✓ All responses include care_type, severity, recommendation
✓ No PHI logged to console
✓ System never leaves user without guidance

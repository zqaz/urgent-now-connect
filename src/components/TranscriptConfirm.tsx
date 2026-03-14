import { useState } from "react";
import { CheckCircle, Pencil, ArrowRight, RotateCcw } from "lucide-react";

interface TranscriptConfirmProps {
  transcript: string;
  onConfirm: (text: string) => void;
  onRetry: () => void;
}

const TranscriptConfirm = ({ transcript, onConfirm, onRetry }: TranscriptConfirmProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcript);

  const handleConfirm = () => {
    onConfirm(editedText.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <CheckCircle className="w-5 h-5 text-safe-green" />
          <h2 className="text-lg font-semibold text-foreground">Confirm Your Symptoms</h2>
        </div>

        <p className="text-sm text-muted-foreground text-center mb-6">
          Review what we heard. Edit if needed, then continue.
        </p>

        <div className="bg-card rounded-xl shadow-card p-5 mb-6 border border-border">
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[120px] bg-muted/50 rounded-lg p-3 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              autoFocus
            />
          ) : (
            <p className="text-sm text-foreground leading-relaxed italic">
              "{editedText}"
            </p>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            {isEditing ? "Done editing" : "Edit transcript"}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Re-record
          </button>

          <button
            onClick={handleConfirm}
            disabled={!editedText.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 cursor-pointer"
          >
            Evaluate
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptConfirm;

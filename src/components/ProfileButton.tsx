import { User } from "lucide-react";
import { UserProfile } from "@/hooks/useProfile";

interface ProfileButtonProps {
  profile: UserProfile | null;
  isLoggedIn: boolean;
  onClick: () => void;
}

const ProfileButton = ({ profile, isLoggedIn, onClick }: ProfileButtonProps) => {
  const initials = profile?.name
    ? profile.name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : null;

  return (
    <button
      onClick={onClick}
      title={isLoggedIn ? "My Profile" : "Sign In"}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {isLoggedIn && initials ? (
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <span className="text-primary-foreground font-bold text-xs">{initials}</span>
        </div>
      ) : isLoggedIn ? (
        <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </button>
  );
};

export default ProfileButton;

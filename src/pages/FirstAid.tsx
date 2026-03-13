import { useState } from "react";
import {
  Heart,
  Wind,
  Droplets,
  Flame,
  AlertTriangle,
  Zap,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmergencyHeader from "@/components/EmergencyHeader";
import { firstAidTips, type FirstAidTip } from "@/data/firstAidTips";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Wind,
  Droplets,
  Flame,
  AlertTriangle,
  Zap,
};

const TipCard = ({ tip, index }: { tip: FirstAidTip; index: number }) => {
  const [open, setOpen] = useState(false);
  const Icon = iconMap[tip.icon] || Heart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
        onClick={() => setOpen(!open)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{tip.title}</h3>
              <p className="text-sm text-muted-foreground">{tip.summary}</p>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 border-t pt-4">
                  <ol className="space-y-2">
                    {tip.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <Badge
                          variant="secondary"
                          className="mt-0.5 h-5 w-5 shrink-0 justify-center rounded-full p-0 text-xs"
                        >
                          {i + 1}
                        </Badge>
                        <span className="text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {tip.warning && (
                    <div className="mt-4 rounded-lg bg-warning/10 p-3">
                      <p className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        <span className="text-foreground">{tip.warning}</span>
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FirstAid = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EmergencyHeader />

      <main className="flex-1 px-4 py-6">
        <div className="container mx-auto max-w-2xl">
          <h1 className="mb-1 text-2xl font-bold text-foreground">
            First Aid Tips
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Quick guides for common emergencies. Tap a topic to expand.
          </p>

          <div className="space-y-3">
            {firstAidTips.map((tip, i) => (
              <TipCard key={tip.id} tip={tip} index={i} />
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> These tips are for informational purposes only and are not a substitute for professional medical training or advice. In a real emergency, always call 911.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FirstAid;

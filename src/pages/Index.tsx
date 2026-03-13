import { MapPin, Stethoscope, Building2, Pill, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import EmergencyHeader from "@/components/EmergencyHeader";

const categories = [
  {
    label: "Urgent Care",
    icon: Stethoscope,
    filter: "urgent-care",
    desc: "Walk-in clinics for non-life-threatening issues",
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Emergency Room",
    icon: Building2,
    filter: "emergency-room",
    desc: "For serious or life-threatening emergencies",
    color: "bg-emergency/10 text-emergency",
  },
  {
    label: "Pharmacy",
    icon: Pill,
    filter: "pharmacy",
    desc: "Medications and over-the-counter supplies",
    color: "bg-success/10 text-success",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EmergencyHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:pb-20 sm:pt-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
          <div className="container relative mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Find Help <span className="text-primary">Now</span>
              </h1>
              <p className="mx-auto mb-8 max-w-md text-lg text-muted-foreground">
                Quickly locate the nearest urgent care, emergency room, or pharmacy when every second counts.
              </p>
              <Button
                size="lg"
                className="gap-2 px-8 text-base font-semibold shadow-lg"
                onClick={() => navigate("/results")}
              >
                <MapPin className="h-5 w-5" />
                Find Help Near Me
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="px-4 pb-16">
          <div className="container mx-auto max-w-3xl">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Browse by Category
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.filter}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                >
                  <Link to={`/results?type=${cat.filter}`}>
                    <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md">
                      <CardContent className="flex flex-col items-center p-6 text-center">
                        <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}>
                          <cat.icon className="h-6 w-6" />
                        </div>
                        <h3 className="mb-1 font-semibold text-foreground">{cat.label}</h3>
                        <p className="text-sm text-muted-foreground">{cat.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* First Aid CTA */}
        <section className="border-t bg-muted/50 px-4 py-12">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Know What To Do In An Emergency
            </h2>
            <p className="mb-6 text-muted-foreground">
              Quick first aid guides for CPR, choking, burns, and more.
            </p>
            <Link to="/first-aid">
              <Button variant="outline" className="gap-2">
                View First Aid Tips
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        <p>Urgent Now — Not a substitute for professional medical advice. In a real emergency, always call 911.</p>
      </footer>
    </div>
  );
};

export default Index;

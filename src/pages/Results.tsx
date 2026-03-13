import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import EmergencyHeader from "@/components/EmergencyHeader";
import FacilityCard from "@/components/FacilityCard";
import {
  mockFacilities,
  type FacilityType,
  facilityTypeLabels,
} from "@/data/mockFacilities";

const filterOptions: { value: FacilityType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "urgent-care", label: "Urgent Care" },
  { value: "emergency-room", label: "ER" },
  { value: "pharmacy", label: "Pharmacy" },
];

const Results = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "all";
  const [activeFilter, setActiveFilter] = useState<FacilityType | "all">(
    initialType as FacilityType | "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let results = mockFacilities;
    if (activeFilter !== "all") {
      results = results.filter((f) => f.type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.address.toLowerCase().includes(q)
      );
    }
    return results.sort((a, b) => a.distance - b.distance);
  }, [activeFilter, searchQuery]);

  const handleFilter = (value: FacilityType | "all") => {
    setActiveFilter(value);
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ type: value });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <EmergencyHeader />

      <main className="flex-1 px-4 py-6">
        <div className="container mx-auto max-w-2xl">
          <h1 className="mb-1 text-2xl font-bold text-foreground">
            Nearby Facilities
          </h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Showing facilities sorted by distance from your location
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={activeFilter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilter(opt.value)}
                className="rounded-full"
              >
                {opt.label}
                {opt.value !== "all" && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-5 min-w-[1.25rem] px-1 text-xs"
                  >
                    {mockFacilities.filter((f) =>
                      opt.value === "all" ? true : f.type === opt.value
                    ).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground">
                  No facilities found. Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              filtered.map((facility, i) => (
                <FacilityCard key={facility.id} facility={facility} index={i} />
              ))
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Wait times are estimated and may vary. Data shown is for demo purposes.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Results;

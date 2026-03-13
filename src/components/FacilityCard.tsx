import { Phone, Navigation, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type Facility,
  facilityTypeLabels,
  facilityTypeColors,
} from "@/data/mockFacilities";
import { motion } from "framer-motion";

interface FacilityCardProps {
  facility: Facility;
  index: number;
}

const FacilityCard = ({ facility, index }: FacilityCardProps) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facility.address)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge className={`${facilityTypeColors[facility.type]} text-xs`}>
                  {facilityTypeLabels[facility.type]}
                </Badge>
                {facility.open24h && (
                  <Badge variant="outline" className="text-xs">
                    24h
                  </Badge>
                )}
              </div>
              <h3 className="mb-1 truncate text-base font-semibold text-foreground">
                {facility.name}
              </h3>
              <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{facility.address}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Navigation className="h-3.5 w-3.5" />
                  {facility.distance} mi · {facility.driveTime} min
                </span>
                {facility.waitTime !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    ~{facility.waitTime} min wait
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <a href={`tel:${facility.phone}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Call
              </Button>
            </a>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button size="sm" className="w-full gap-1.5">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FacilityCard;

import { getSortedEvents, persons, locations } from "@/lib/data";
import { TimelineClient } from "@/components/timeline/timeline-client";

export default function CronologiaPage() {
  const events = getSortedEvents();

  return <TimelineClient events={events} persons={persons} locations={locations} />;
}

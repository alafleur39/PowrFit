"use client";

import { Bell, Dumbbell, MessageSquare, Plus, Shield, Trash2, Trophy } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart-container";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { ListGroup, ListRow } from "@/components/ui/list-row";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StatGrid, StatTile } from "@/components/ui/stat-tile";
import { Tabs } from "@/components/ui/tabs";
import { Toast, useToast } from "@/components/ui/toast";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3 border-t border-border px-4 py-5 sm:px-6">
      <h2 className="text-headline font-bold">{title}</h2>
      {children}
    </section>
  );
}

// The dev-only Components screen (/dev/components). One section per shared
// component, each in its states. Pressed states show while held.
export function ComponentGallery() {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [toggle, setToggle] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const toast = useToast();

  return (
    <div className="pb-10">
      <ScreenHeader
        title="Components"
        subtitle="Every shared component and its states. Development builds only."
        action={<IconButton label="Notifications" icon={<Bell />} variant="secondary" />}
      />

      <Section title="Button">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled>Disabled</Button>
          <Button loading>Saving</Button>
          <Button variant="secondary" loading>
            Loading
          </Button>
          <Button variant="destructive" disabled>
            Disabled
          </Button>
        </div>
        <Button size="lg" block>
          <Dumbbell aria-hidden />
          Full width, large
        </Button>
        <Button variant="secondary" size="lg" block>
          <Plus aria-hidden />
          Full width secondary
        </Button>
      </Section>

      <Section title="IconButton">
        <div className="flex gap-2">
          <IconButton label="Add" icon={<Plus />} />
          <IconButton label="Add" icon={<Plus />} variant="secondary" />
          <IconButton label="Delete" icon={<Trash2 />} variant="destructive" />
          <IconButton label="Disabled" icon={<Plus />} disabled />
        </div>
      </Section>

      <Section title="Card">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-body font-semibold">A card</p>
          <p className="text-footnote text-muted-foreground">Surface, a hairline border and 16pt corners. No shadow.</p>
        </div>
      </Section>

      <Section title="StatTile">
        <StatGrid label="Example stats" columns={3}>
          <StatTile label="Workouts" value="3" />
          <StatTile label="Volume" value="18,530" unit="lb" highlight />
          <StatTile label="Streak" value="5" hint="weeks" />
        </StatGrid>
        <StatGrid label="Large numbers" columns={2}>
          <StatTile label="Total volume" value="1,284,930" unit="lb" />
          <StatTile label="A very long label that truncates" value="12" />
        </StatGrid>
      </Section>

      <Section title="SegmentedControl">
        <SegmentedControl
          ariaLabel="Range"
          segments={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "year", label: "Year" },
          ]}
          value={range}
          onChange={setRange}
        />
      </Section>

      <Section title="Tabs">
        <Tabs
          ariaLabel="Example sections"
          tabs={[
            { id: "one", label: "Routines", content: <p className="p-4 text-footnote text-muted-foreground">Routines panel</p> },
            { id: "two", label: "History", content: <p className="p-4 text-footnote text-muted-foreground">History panel</p> },
            { id: "three", label: "Explore", content: <p className="p-4 text-footnote text-muted-foreground">Explore panel</p> },
          ]}
        />
      </Section>

      <Section title="ListRow">
        <ListGroup title="Settings">
          <ListRow icon={<MessageSquare />} title="Chevron row" description="Goes somewhere" onClick={() => {}} />
          <ListRow icon={<Shield />} title="Without a description" onClick={() => {}} />
          <ListRow variant="toggle" icon={<Bell />} title="Toggle row" checked={toggle} onCheckedChange={setToggle} />
          <ListRow variant="destructive" icon={<Trash2 />} title="Delete account" onClick={() => {}} />
        </ListGroup>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          className="p-0 sm:p-0"
          icon={<Dumbbell />}
          title="No workouts yet"
          description="Start one from Home and it shows up here."
          action={<Button>Start a workout</Button>}
        />
      </Section>

      <Section title="Skeleton">
        <div aria-busy className="flex flex-col gap-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </Section>

      <Section title="Toast">
        <div className="flex flex-col items-start gap-2">
          <Toast text="Workout saved" tone="success" />
          <Toast text="Couldn't sync. We'll retry." tone="warning" />
          <Toast text="Copied to My routines" />
          <Button variant="secondary" onClick={() => toast("Set logged", "success")}>
            Show a toast
          </Button>
        </div>
      </Section>

      <Section title="Sheet">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
        <Sheet
          open={sheetOpen}
          title="A sheet"
          onClose={() => setSheetOpen(false)}
          footer={
            <Button block onClick={() => setSheetOpen(false)}>
              Done
            </Button>
          }
        >
          <p className="text-footnote text-muted-foreground">Bottom sheet on phones, a centred dialog on desktop.</p>
        </Sheet>
      </Section>

      <Section title="ChartContainer">
        <ChartContainer title="Bench press, top set" unit="lb" count={0} emptyText="Finish a workout with this lift to see its trend." singleText="">
          {null}
        </ChartContainer>
        <ChartContainer
          title="Bench press, top set"
          unit="lb"
          count={1}
          emptyText=""
          singleText="Log one more session to see a trend."
          single={
            <p className="flex items-center gap-2 text-title2 font-bold tabular-nums">
              <Trophy className="size-5 text-accent" aria-hidden />
              185 <span className="text-footnote font-semibold text-muted-foreground">lb</span>
            </p>
          }
        >
          {null}
        </ChartContainer>
        <ChartContainer title="Bench press, top set" unit="lb" count={5} emptyText="" singleText="">
          <div className="flex h-24 items-end gap-2" aria-hidden>
            {[40, 55, 50, 70, 90].map((height, index) => (
              <div key={index} className="flex-1 rounded-input bg-accent" style={{ height: `${height}%` }} />
            ))}
          </div>
        </ChartContainer>
      </Section>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Band,
  Button,
  Keycap,
  Label,
  Panel,
  Rise,
  SectionHeader,
  StatusBadge,
  StatusLight,
  Tag,
  UiFragment,
} from "@/components/system";
import { LabInteractive } from "./lab-interactive";

export const metadata: Metadata = {
  title: "Component lab",
  robots: { index: false, follow: false },
};

/** Dev-only preview of the design system. Not available in production builds. */
export default function LabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main>
      <Band className="section-pad">
        <div className="wrap">
          <SectionHeader
            index="00"
            label="Component lab"
            title={
              <>
                Base parts, <em>built once.</em>
              </>
            }
            intro="Every material, light and control from DESIGN.md §5, on cream and on ink. Dev only."
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Panel className="flex flex-col gap-5 p-7">
              <Label>Buttons</Label>
              <div className="flex flex-wrap gap-3">
                <Button href="#contact" arrow>
                  Start a project
                </Button>
                <Button href="#work" variant="paper">
                  See the work
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="ink" size="lg" magnetic={false}>
                  Send message
                </Button>
                <Button variant="paper" disabled>
                  Disabled
                </Button>
              </div>
            </Panel>

            <Panel className="flex flex-col gap-5 p-7">
              <Label>Type</Label>
              <p className="type-card">
                Card title <em>italic</em>
              </p>
              <p className="type-body text-muted">
                Body copy in Hanken Grotesk at 17px. Plain, specific, active: the system flags risky orders
                and the owner approves.
              </p>
              <Label accent>Active label · walnut</Label>
            </Panel>

            <Panel screws className="flex flex-col gap-5 p-7">
              <Label>Lights, keys, badges</Label>
              <div className="flex flex-wrap items-center gap-4">
                <StatusLight label="Booking for December" />
                <StatusLight on={false} label="Off" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Keycap>SA</Keycap>
                <Keycap tone="paper" pressable>
                  ⌘
                </Keycap>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="client" />
                <StatusBadge status="product">Product build</StatusBadge>
                <StatusBadge status="confidential" />
                <Tag>E-commerce + operations</Tag>
              </div>
            </Panel>
          </div>
        </div>
      </Band>

      <LabInteractive />

      <Band tone="ink" className="section-pad">
        <div className="wrap">
          <SectionHeader
            index="01"
            label="On ink"
            title={
              <>
                Three layers. <em>One build.</em>
              </>
            }
            intro="Labels, emphasis and lights switch tone automatically on ink bands."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Rise>
              <Panel tone="ink" className="flex flex-col gap-4 p-7">
                <div className="flex items-center justify-between">
                  <Label>Layer 1 · Glass</Label>
                  <StatusLight />
                </div>
                <h3 className="type-card">Website</h3>
                <p className="text-[15.5px] text-muted-ink">
                  Fast sites that explain what you sell and turn visitors into enquiries.
                </p>
              </Panel>
            </Rise>
            <Rise delay={0.08} className="flex flex-col items-start gap-4">
              <UiFragment tag="Order risk guard" text="Order #1042 flagged: duplicate address" live />
              <UiFragment tag="Restock agent" text="Restock 3 items running low?" actions={["Approve", "Skip"]} />
            </Rise>
            <Rise delay={0.16} className="flex flex-col items-start gap-4">
              <Button href="#top" variant="paper" arrow>
                Read the case study
              </Button>
              <Button href="#top">Start a project</Button>
            </Rise>
          </div>
        </div>
      </Band>
    </main>
  );
}

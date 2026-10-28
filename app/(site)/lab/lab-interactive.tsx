"use client";

import { useRef, useState } from "react";
import {
  Band,
  Button,
  Cartridge,
  Drawer,
  InsetToggle,
  Label,
  Panel,
  Screen,
  SectionHeader,
  Switch,
  TypeText,
  type ScreenHandle,
} from "@/components/system";

const filters = [
  { value: "all", label: "All" },
  { value: "systems", label: "Systems" },
  { value: "web", label: "Web tools" },
  { value: "auto", label: "Automations" },
] as const;

type Filter = (typeof filters)[number]["value"];

export function LabInteractive() {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"customer" | "owner">("customer");
  const [channels, setChannels] = useState({ site: true, orders: false, leads: false });
  const screen = useRef<ScreenHandle>(null);

  return (
    <Band className="section-pad pt-0 min-[900px]:pt-0">
      <div className="wrap flex flex-col gap-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel className="flex flex-col gap-6 p-7">
            <Label>Inset toggles</Label>
            <InsetToggle label="Filter projects" options={filters} value={filter} onChange={setFilter} />
            <InsetToggle
              label="Monitor view"
              options={[
                { value: "customer", label: "Customer view" },
                { value: "owner", label: "Owner view" },
              ]}
              value={view}
              onChange={setView}
            />
            <Label>Switches</Label>
            <div className="flex flex-wrap gap-6">
              {(["site", "orders", "leads"] as const).map((c) => (
                <Switch
                  key={c}
                  label={c}
                  checked={channels[c]}
                  onCheckedChange={(v) => setChannels((s) => ({ ...s, [c]: v }))}
                />
              ))}
            </div>
          </Panel>

          <Panel className="flex flex-col gap-5 p-7">
            <div className="flex items-center justify-between">
              <Label>Screen · boots on enter</Label>
              <Button variant="paper" magnetic={false} onClick={() => screen.current?.boot()}>
                Reboot
              </Button>
            </div>
            <Screen ref={screen} className="min-h-40 p-5 font-mono text-[13px] leading-loose">
              <div className="relative z-[3] flex flex-col">
                <TypeText as="div" text="› Daily briefing ready for the owner" />
                <TypeText as="div" delay={500} text="› Order #1042 flagged: duplicate address" />
                <TypeText as="div" delay={1100} text="› Checkout reminder sent with a discount code" />
              </div>
            </Screen>
          </Panel>
        </div>

        <div>
          <SectionHeader index="03" label="Archive" title={<>More <em>builds</em></>} />
          <div className="grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            <Cartridge
              title="Restaurant management"
              kind="Management system"
              status="product"
              summary="Orders, tables, menu and daily sales in one dashboard for the owner and staff."
              fact="Orders, tables and daily sales"
            />
            <Cartridge
              title="ISP subscriber billing"
              kind="Management system"
              status="client"
              summary="Subscriber management and billing for an internet service provider in Pakistan."
              fact="Subscribers and billing cycles"
            />
            <Cartridge
              title="Lead management system"
              kind="Backend"
              status="confidential"
              summary="Backend for a US sales team's lead system that suggests which states to target, based on past data."
              fact="Suggests target states from past data"
            />
          </div>
        </div>

        <div className="flex max-w-[940px] flex-col gap-3.5">
          <SectionHeader index="07" label="Questions" title={<>Before <em>you ask</em></>} className="mb-6" />
          <Drawer defaultOpen question="Do you work with clients outside Pakistan?">
            <p>Lab copy. Real answers come from the admin panel.</p>
          </Drawer>
          <Drawer question="Can you add automations to my existing website?">
            <p>Lab copy. Real answers come from the admin panel.</p>
          </Drawer>
        </div>
      </div>
    </Band>
  );
}

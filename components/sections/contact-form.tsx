"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sendInquiry } from "@/app/actions/contact";
import { checkContact, type ContactField, type ContactState } from "@/lib/contact-rules";
import { Screen, Screws, StatusLight, TypeText, type ScreenHandle } from "@/components/system";
import { cn } from "@/lib/utils";

type Line = { text: string; key: number };

const field =
  "ink-inset w-full rounded-[11px] border-0 px-[15px] py-3.5 text-[16px] text-paper placeholder:text-[#6f675c] focus:outline-none " +
  // Focus: a copper underline draws across the field, over a softened ring.
  // (marked important: the ink-inset background shorthand would otherwise reset them)
  "bg-[linear-gradient(var(--color-copper),var(--color-copper))]! bg-no-repeat! bg-[length:0%_2px]! bg-[position:left_bottom]! " +
  "transition-[background-size,box-shadow] duration-[260ms] ease-out-expo focus:bg-[length:100%_2px]! " +
  "focus:shadow-[var(--shadow-ink-inset),0_0_0_2px_rgb(201_133_63/.45)] aria-invalid:shadow-[var(--shadow-ink-inset),0_0_0_2px_#e7a27f]";
const labelCls = "type-label text-[10.5px] text-muted-ink";

/** True on phones (under 768px); false on the server, so desktop markup renders first. */
const phoneQuery = "(max-width: 767px)";
function usePhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(phoneQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(phoneQuery).matches,
    () => false,
  );
}

/**
 * Control-panel form (DESIGN.md §8 Contact). The readout screen boots and
 * prints the result; "Message received" only prints after the server confirms.
 */
export function ContactForm({ projectTypes, budgetRanges }: { projectTypes: string[]; budgetRanges: string[] }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendInquiry, { status: "idle" });
  const [clientError, setClientError] = useState<{ field?: ContactField; message: string } | null>(null);
  const [lines, setLines] = useState<Line[]>([{ text: "Ready. Fill in the fields below.", key: 0 }]);
  const [printKey, setPrintKey] = useState(0);
  const screen = useRef<ScreenHandle>(null);
  const form = useRef<HTMLFormElement>(null);
  // Project type: chips on phones, a select on larger screens. Only the one in
  // use carries the field name, so the form always sends a single value.
  const phone = usePhone();
  const [projectType, setProjectType] = useState(projectTypes[0] ?? "");

  const print = (texts: string[]) => {
    const key = Date.now();
    setLines(texts.map((text, i) => ({ text, key: key + i })));
    setPrintKey((k) => k + 1);
    screen.current?.boot();
  };

  // "› Transmitted" shows briefly, then the button reads "Send message" again
  // (the screen above keeps "Message received"), so another message can follow.
  const [justSent, setJustSent] = useState(false);
  useEffect(() => {
    if (!justSent) return;
    const id = window.setTimeout(() => setJustSent(false), 2600);
    return () => window.clearTimeout(id);
  }, [justSent]);

  // Print the server's answer once it arrives.
  const lastState = useRef(state);
  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    const id = window.setTimeout(() => {
      if (state.status === "ok") {
        print(["Message received", "Reply within 24h"]);
        setJustSent(true);
        form.current?.reset();
        setProjectType(projectTypes[0] ?? "");
      } else if (state.status === "error") {
        print([`Not sent: ${state.message}`, ...(state.fix ? [state.fix] : [])]);
        if (state.field) form.current?.querySelector<HTMLElement>(`[name="${state.field}"]`)?.focus();
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [state, projectTypes]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const issue = checkContact(Object.fromEntries(new FormData(e.currentTarget)));
    if (issue) {
      e.preventDefault();
      setClientError(issue);
      e.currentTarget.querySelector<HTMLElement>(`[name="${issue.field}"]`)?.focus();
      return;
    }
    setClientError(null);
    print(["Transmitting…"]);
  };

  const error = clientError ?? (state.status === "error" && state.field ? state : null);
  const invalid = (name: ContactField) => error?.field === name || undefined;
  const sent = justSent;

  return (
    <div className="tone-ink relative rounded-[28px] bg-[linear-gradient(165deg,#2a231c,var(--color-ink-2)_55%,#14110e)] p-[22px] shadow-ink-raised min-[560px]:p-[30px]">
      <Screws tone="ink" />
      <Screen ref={screen} bootOn="view" className="mb-5 min-h-14 px-4 py-3.5 font-mono text-[12.5px] leading-[1.8]">
        <div role="status" aria-live="polite" className="relative z-[3]">
          {lines.map((l, i) => (
            <TypeText
              key={l.key}
              as="div"
              text={`› ${l.text}`}
              trigger={printKey}
              delay={380 + i * 420}
            />
          ))}
        </div>
      </Screen>

      <form ref={form} action={action} onSubmit={onSubmit} onInput={() => setJustSent(false)} noValidate className="flex flex-col gap-[18px]">
        <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="f-name" className={labelCls}>
              Name
            </label>
            <input id="f-name" name="name" type="text" autoComplete="name" autoCapitalize="words" enterKeyHint="next" required aria-invalid={invalid("name")} className={field} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-email" className={labelCls}>
              Email
            </label>
            <input
              id="f-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              required
              aria-invalid={invalid("email")}
              className={field}
            />
          </div>
        </div>
        <div className={cn("grid grid-cols-1 gap-4", budgetRanges.length > 0 && "min-[560px]:grid-cols-2")}>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-type" className={cn(labelCls, "max-[767px]:hidden")}>
              Project
            </label>
            <span aria-hidden="true" className={cn(labelCls, "min-[768px]:hidden")}>
              Project
            </span>
            <select
              id="f-type"
              name={phone ? undefined : "projectType"}
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className={cn(field, "appearance-none max-[767px]:hidden")}
            >
              {projectTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {/* One swipeable line of chips (the last one peeks), not three wrapped rows. */}
            <div role="radiogroup" aria-label="Project" className="-mr-[22px] flex gap-2 overflow-x-auto overscroll-x-contain pr-[22px] [scrollbar-width:none] min-[768px]:hidden [&::-webkit-scrollbar]:hidden">
              {projectTypes.map((t) => (
                <label
                  key={t}
                  className="inline-flex min-h-11 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full px-4 text-[15px] shadow-[inset_0_0_0_1px_var(--color-ink-3)] transition-[background-color,color,box-shadow,scale] duration-[150ms] active:scale-[0.97] has-[:checked]:bg-copper has-[:checked]:font-semibold has-[:checked]:text-[#140d08] has-[:checked]:shadow-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-copper"
                >
                  <input
                    type="radio"
                    name={phone ? "projectType" : undefined}
                    value={t}
                    checked={projectType === t}
                    onChange={() => setProjectType(t)}
                    className="sr-only"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>
          {budgetRanges.length > 0 && (
            <div className="flex flex-col gap-2">
              <label htmlFor="f-budget" className={labelCls}>
                Budget
              </label>
              <select id="f-budget" name="budget" className={cn(field, "appearance-none")}>
                {budgetRanges.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="f-msg" className={labelCls}>
            What do you need?
          </label>
          <textarea
            id="f-msg"
            name="message"
            rows={4}
            required
            aria-invalid={invalid("message")}
            placeholder="We run a clothing brand and spend hours checking orders by hand…"
            className={cn(field, "min-h-[100px] resize-y min-[560px]:min-h-[120px]")}
          />
        </div>
        {/* Honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor="f-web">Website</label>
          <input id="f-web" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <p role="alert" className="min-h-0 text-[13.5px] text-[#e7a27f] empty:hidden">
          {error?.message}
        </p>
        <button
          type="submit"
          disabled={pending}
          data-pressed={pending || undefined}
          className={cn(
            "flex min-h-[68px] cursor-pointer items-center justify-center gap-3 rounded-[14px] font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink",
            "bg-[linear-gradient(180deg,var(--color-paper-hi),var(--color-paper-lo))] transition-[transform,box-shadow] duration-75",
            "shadow-[inset_0_1px_0_#fff,inset_0_-6px_0_var(--color-paper-edge),0_6px_0_#0a0a0a,0_14px_24px_-10px_rgb(0_0_0/.8)]",
            "active:translate-y-[5px] active:shadow-[inset_0_1px_0_#fff,inset_0_-3px_0_var(--color-paper-edge),0_1px_0_#0a0a0a,0_4px_10px_-6px_rgb(0_0_0/.8)]",
            "data-pressed:translate-y-[5px] data-pressed:shadow-[inset_0_1px_0_#fff,inset_0_-3px_0_var(--color-paper-edge),0_1px_0_#0a0a0a,0_4px_10px_-6px_rgb(0_0_0/.8)]",
          )}
        >
          <StatusLight on={sent || pending} pulse={pending} />
          {/* idle → transmitting → transmitted (only after the server confirms). */}
          <span aria-live="polite">{pending ? "Transmitting…" : sent ? "› Transmitted" : "Send message"}</span>
        </button>
      </form>
    </div>
  );
}

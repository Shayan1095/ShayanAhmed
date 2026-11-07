"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Project } from "@/lib/content/types";
import { ProjectTile } from "@/components/site/project-tile";
import { BottomSheet, Label, Tag } from "@/components/system";

export const code = (n: number) => `SA–${String(n).padStart(2, "0")}`;

/**
 * The archive on phones (motion spec, Phase 4): compact index rows (code,
 * type, name, thumbnail) instead of tall cards. Tapping a row opens its
 * details in a bottom sheet.
 */
export function ArchiveRows({ projects, codeStart = 1 }: { projects: Project[]; codeStart?: number }) {
  const [open, setOpen] = useState<Project | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const openIndex = open ? projects.indexOf(open) : -1;

  return (
    <>
      <ul className="flex flex-col border-t border-paper-edge">
        {projects.map((p, i) => (
          <li key={p.slug} className="border-b border-paper-edge">
            <button
              type="button"
              onClick={() => setOpen(p)}
              aria-haspopup="dialog"
              className="press flex min-h-[84px] w-full items-center gap-4 py-3.5 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex items-center gap-2.5">
                  <Label accent>{code(codeStart + i)}</Label>
                  <Label className="truncate">{p.kind}</Label>
                </span>
                <span className="truncate font-display text-[20px] font-extrabold leading-tight tracking-[-0.01em]">{p.title}</span>
              </span>
              <ProjectTile project={p} label={false} sizes="96px" className="aspect-[4/3] w-24 shrink-0 rounded-[10px]" />
            </button>
          </li>
        ))}
      </ul>

      <ProjectSheet project={open} code={code(codeStart + openIndex)} onClose={close} />
    </>
  );
}

/** A project's details in a bottom sheet (archive rows and the phone work row). */
export function ProjectSheet({ project, code, onClose }: { project: Project | null; code: string; onClose: () => void }) {
  const open = project;
  return (
    <BottomSheet open={project !== null} onClose={onClose} label={project?.title ?? "Project"}>
        {open && (
          <div className="flex flex-col gap-4 pt-1">
            <ProjectTile project={open} sizes="100vw" className="aspect-[16/10] w-full rounded-[16px]" />
            <div className="flex flex-wrap items-center gap-2">
              <Label accent>{code}</Label>
              <Tag>{open.kind}</Tag>
            </div>
            <h3 className="font-display text-[30px] font-extrabold leading-[1.02] tracking-[-0.02em]">{open.title}</h3>
            <p className="text-[16px] text-muted">{open.summary}</p>
            {open.fact && (
              <p className="rounded-[12px] bg-paper-lo px-4 py-3 font-mono text-[13px] leading-relaxed">
                <span aria-hidden="true" className="mr-2 text-copper">
                  ›
                </span>
                {open.fact}
              </p>
            )}
            {open.stack.length > 0 && (
              <ul aria-label="Stack" className="flex flex-wrap gap-2">
                {open.stack.map((s) => (
                  <li key={s}>
                    <Tag>{s}</Tag>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-1 flex flex-wrap gap-3">
              {open.hasCaseStudy && (
                <Link
                  href={`/work/${open.slug}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-control bg-copper px-5 text-[16px] font-bold text-[#140d08]"
                >
                  Read the case study <span aria-hidden="true">→</span>
                </Link>
              )}
              {open.liveUrl && (
                <a
                  href={open.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-control px-5 text-[16px] font-semibold shadow-[inset_0_0_0_1px_var(--color-paper-edge)]"
                >
                  Visit the site <span aria-hidden="true">↗</span>
                </a>
              )}
              <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center px-3 text-[16px] font-semibold text-muted">
                Close
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
  );
}

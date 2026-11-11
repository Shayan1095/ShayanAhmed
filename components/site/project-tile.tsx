import type { Project } from "@/lib/content/types";
import { initials, ProjectMedia } from "./project-media";

export { initials };

/**
 * A project's picture for cards, rows and tiles (archive, footer "Recent
 * work", the phone work row, the next-case card): ProjectMedia with the still,
 * and on mouse and trackpad devices the recording plays on hover. With nothing
 * to show, the monogram tile (never an empty frame). The parent sets the size;
 * pass an aspect-* class to change the default 16:10.
 */
export function ProjectTile({
  project,
  className,
  sizes = "88vw",
  label = true,
}: {
  project: Pick<
    Project,
    "title" | "poster" | "cover" | "customerView" | "ownerView" | "video" | "videoCustomer" | "videoOwner" | "monitorLabel"
  >;
  className?: string;
  sizes?: string;
  /** Show the monitor label under the initials on bigger tiles. */
  label?: boolean;
}) {
  return <ProjectMedia project={project} play="hover" sizes={sizes} label={label} className={className} />;
}

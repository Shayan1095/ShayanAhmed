import { ImageResponse } from "next/og";
import { getProject, getProjects } from "@/lib/content";
import { OgFrame, ogContentType, ogFonts, ogSize, publicImageDataUrl } from "@/lib/og";

export const alt = "Case study by Shayan Ahmed";
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  return (await getProjects()).filter((p) => p.hasCaseStudy).map((p) => ({ slug: p.slug }));
}

/** Per-project social preview: title, kind, first UI fragment and the screenshot when there is one. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  const title = project?.title ?? "Case study";
  const cover = project?.customerView ?? project?.cover;
  const fragment = project?.uiFragments[0];
  const words = title.split(" ");

  return new ImageResponse(
    (
      <OgFrame
        label={`Case study · ${project?.kind ?? "Shayan Ahmed"}`}
        lines={words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [title]}
        strip={fragment ? { tag: fragment.tag, text: fragment.text } : { tag: "Build", text: project?.summary.slice(0, 48) ?? "" }}
        image={cover ? await publicImageDataUrl(cover.src) : undefined}
        summary={cover ? undefined : project?.summary}
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}

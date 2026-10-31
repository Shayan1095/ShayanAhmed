import { PageSkeleton } from "@/components/admin/page-header";

/**
 * Every admin screen reads the session, which can't be prerendered. This
 * boundary shows the skeleton straight away on navigation while the screen
 * streams in (Next.js instant navigation).
 */
export default function Loading() {
  return <PageSkeleton />;
}

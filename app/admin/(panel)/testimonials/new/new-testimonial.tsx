"use client";

import { useRouter } from "next/navigation";
import { emptyTestimonial, TestimonialForm } from "../testimonial-form";

export function NewTestimonial(props: { projects: { slug: string; title: string }[]; canUpload: boolean }) {
  const router = useRouter();
  return (
    <TestimonialForm
      id={null}
      initial={emptyTestimonial}
      submitLabel="Add testimonial"
      onSaved={() => router.push("/admin/testimonials")}
      {...props}
    />
  );
}

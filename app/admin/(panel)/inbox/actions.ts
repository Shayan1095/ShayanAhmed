"use server";

import { z } from "zod";
import { adminAction } from "@/lib/admin/action";
import { idSchema } from "@/lib/admin/schemas";
import { InquiryModel } from "@/lib/db/models";

const status = z.enum(["new", "read", "replied", "archived"]);

export async function setInquiryStatus(id: string, next: z.input<typeof status>) {
  return adminAction(async () => {
    await InquiryModel.updateOne({ _id: idSchema.parse(id) }, { $set: { status: status.parse(next) } });
  });
}

export async function deleteInquiry(id: string) {
  return adminAction(async () => {
    await InquiryModel.deleteOne({ _id: idSchema.parse(id) });
  });
}

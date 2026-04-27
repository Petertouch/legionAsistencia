import { redirect } from "next/navigation";

export default function AliadoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Redirect to unified referidores page
  redirect("/admin/referidores");
}

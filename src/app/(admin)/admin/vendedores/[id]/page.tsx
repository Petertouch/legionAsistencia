import { redirect } from "next/navigation";

export default function VendedorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  redirect("/admin/referidores");
}

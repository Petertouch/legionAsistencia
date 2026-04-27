"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function RedirectToAliados() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") || "";
  useEffect(() => { router.replace(`/aliados/panel?code=${code}`); }, [router, code]);
  return null;
}

export default function LanzasPanelPage() {
  return <Suspense><RedirectToAliados /></Suspense>;
}

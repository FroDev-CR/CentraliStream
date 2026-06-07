"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresca la página cada 5s para detectar cuando el pago se confirma. */
export function OrderPoller() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}

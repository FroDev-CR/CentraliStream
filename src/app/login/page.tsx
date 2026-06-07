import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isSupabaseConfigured } from "@/lib/config";
import { SetupNotice } from "@/components/setup-notice";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      {isSupabaseConfigured() ? (
        <Suspense>
          <LoginForm />
        </Suspense>
      ) : (
        <SetupNotice />
      )}
    </div>
  );
}

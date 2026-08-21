import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { routes } from "@/config/routes";
import { SignInForm } from "@/features/admin/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  // An admin login screen has nothing to offer a search engine, and listing
  // it only advertises where the door is.
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = single(params["next"]);
  const status = single(params["status"]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href={routes.home} className="mb-10 inline-block">
          <Logo priority />
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The Grant Ninja operations portal. Accounts are created by a super admin.
        </p>

        {status === "inactive" && (
          <Alert className="mt-6" role="status">
            <AlertDescription>
              Your account exists but has not been activated yet. A super admin needs to enable it
              before you can sign in.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <SignInForm next={next} />
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          <Link href={routes.home} className="hover:text-foreground hover:underline">
            Back to the public site
          </Link>
        </p>
      </div>
    </div>
  );
}

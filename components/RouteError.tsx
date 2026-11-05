"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";

interface RouteErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
  message: string;
}

export function RouteError({ error, retry, title, message }: RouteErrorProps) {
  useEffect(() => {
    console.error("Route rendering failed.", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12 text-slate-900 sm:px-8">
      <p className="text-sm font-semibold text-blue-700">Local Eye</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={retry} type="button">
          Try again
        </Button>
        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          href="/"
        >
          Back to search
        </Link>
      </div>
      {error.digest && (
        <p className="mt-5 text-xs text-slate-500">Reference: {error.digest}</p>
      )}
    </main>
  );
}

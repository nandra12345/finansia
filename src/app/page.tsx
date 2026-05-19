import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-white/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-lg font-bold text-white">F</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900">Finansia</span>
        </div>
        <div className="flex items-center gap-4">
          {!userId ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Sign In
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants(), "rounded-full px-6")}>
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/overview"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}
              >
                Go to Dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <section className="flex flex-col items-center bg-gradient-to-b from-blue-50/50 to-white px-6 py-24 text-center md:py-32">
          <div className="mb-8 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-blue-600" />
            Now in Private Beta
          </div>
          <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight text-neutral-900 md:text-7xl">
            Master Your Money with <span className="text-blue-600">Intelligence.</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-neutral-600 md:text-xl">
            Finansia is a premium financial management platform designed for the modern era.
            Track, plan, and optimize your finances with smart analytics and elegant design.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-8 text-lg")}
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full px-8 text-lg"
              )}
            >
              Explore Features
            </Link>
          </div>
        </section>

        <section id="features" className="bg-white px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold">Everything you need to thrive</h2>
              <p className="text-neutral-600">
                Powerful tools built for high-performance financial management.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border bg-neutral-50/50 p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Smart Analytics</h3>
                <p className="leading-relaxed text-neutral-600">
                  Deep insights into your spending habits with automated categorization and trend
                  analysis.
                </p>
              </div>

              <div className="rounded-2xl border bg-neutral-50/50 p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Real-time Sync</h3>
                <p className="leading-relaxed text-neutral-600">
                  Your data stays fresh across all devices with our high-speed synchronization engine.
                </p>
              </div>

              <div className="rounded-2xl border bg-neutral-50/50 p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Bank-grade Security</h3>
                <p className="leading-relaxed text-neutral-600">
                  We use the latest encryption standards to ensure your financial data remains
                  private and secure.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-neutral-50 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
              <span className="text-xs font-bold text-white">F</span>
            </div>
            <span className="font-bold tracking-tight">Finansia</span>
          </div>
          <p className="text-sm text-neutral-500">(c) 2026 Finansia Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900">
              Terms
            </Link>
            <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

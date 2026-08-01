import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

import { EasterEggTrigger } from "@/components/easter-egg/easter-egg-trigger";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* NAVBAR ATAS */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b bg-white/50 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center">
          <div
            data-easter-egg-logo
            role="button"
            tabIndex={0}
            aria-label="Finansia logo"
            className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus-visible:rounded-full"
          >
            <img 
              src="/logo.png" 
              alt="Finansia Logo" 
              className="h-20 w-auto object-contain" 
            />
          </div>
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
              {/* Mengubah warna tombol Get Started menjadi hijau */}
              <Link 
                href="/sign-up" 
                className={cn(buttonVariants(), "rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 text-white border-none")}
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/overview"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6")}
              >
                Go to Dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>
      </nav>

      {/* MAIN HERO SECTION */}
      <main className="flex-1">
        <section className="flex flex-col items-center bg-gradient-to-b from-emerald-50/40 to-white px-6 py-24 text-center md:py-32">
          <div className="mb-8 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-emerald-600" />
            Now in Private Beta
          </div>
          {/* FIX: Mengubah teks Intelligence menjadi text-emerald-600 (Hijau) */}
          <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight text-neutral-900 md:text-7xl">
            Master Your Money with <span className="text-emerald-600">Intelligence.</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-neutral-600 md:text-xl">
            Finansia is a premium financial management platform designed for the modern era.
            Track, plan, and optimize your finances with smart analytics and elegant design.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 px-8 text-lg text-white border-none")}
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-neutral-300 px-8 text-lg hover:bg-neutral-50"
              )}
            >
              Explore Features
            </Link>
          </div>
        </section>

        {/* FEATURES SECTION */}
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
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
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
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
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

        {/* HOW IT WORKS SECTION */}
        <section className="relative bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Simple & Modern Experience
              </div>

              <h2 className="mb-4 text-4xl font-serif font-semibold tracking-tight text-neutral-900 md:text-5xl">
                Cara Menggunakan <span className="text-emerald-600">Finansia</span>
              </h2>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-neutral-600 font-serif">
                Finansia dibuat untuk pengguna yang ingin mengelola keuangan secara mudah, cepat, dan
                tanpa kompleksitas. Lihat alur kerja yang simpel untuk mulai mengatur keuangan Anda.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-semibold text-emerald-700">
                  1
                </div>
                <h3 className="mb-2 text-xl font-serif font-semibold text-neutral-900">
                  Buat Akun
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Daftar cepat dengan email, lalu masuk aman menggunakan Clerk. Semua data tersimpan
                  dengan enkripsi dan bisa diakses dari perangkat apa pun.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-semibold text-emerald-700">
                  2
                </div>
                <h3 className="mb-2 text-xl font-serif font-semibold text-neutral-900">
                  Input Transaksi
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Catat pemasukan dan pengeluaran harian dengan cepat. Finansia otomatis membantu
                  mengelompokkan transaksi sehingga laporan jadi lebih jelas.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-semibold text-emerald-700">
                  3
                </div>
                <h3 className="mb-2 text-xl font-serif font-semibold text-neutral-900">
                  Analisa & Planning
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Gunakan insight dan planning dalam satu dashboard untuk melihat tren pengeluaran
                  serta menentukan target finansial jangka panjang.
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-semibold text-emerald-700">
                  4
                </div>
                <h3 className="mb-2 text-xl font-serif font-semibold text-neutral-900">
                  Update Berita Finansial
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Pantau berita ekonomi Indonesia dan global langsung dari aplikasi. Data berita
                  otomatis diperbarui tanpa perlu sumber eksternal lain.
                </p>
              </div>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-slate-50 p-8">
                <div className="mb-4 h-1 w-16 rounded-full bg-emerald-500" />
                <h3 className="mb-4 text-2xl font-serif font-semibold text-neutral-900">
                  Built for modern finance
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600">
                  Finansia menyatukan transaksi, perencanaan, dan informasi ekonomi dengan desain yang
                  bersih dan mudah digunakan. Semua ini dirancang agar pengguna fokus pada keputusan.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
                  <p className="text-xl font-semibold text-neutral-900">24/7</p>
                  <p className="mt-1">Akses kapan saja</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
                  <p className="text-xl font-semibold text-neutral-900">Secure</p>
                  <p className="mt-1">Autentikasi Clerk</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
                  <p className="text-xl font-semibold text-neutral-900">Cloud</p>
                  <p className="mt-1">Modern deployment</p>
                </div>
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-700">
                  <p className="text-xl font-semibold text-neutral-900">Live</p>
                  <p className="mt-1">Berita finansial real-time</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative overflow-hidden border-t border-neutral-900 bg-neutral-950/95 px-6 py-12 text-white backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent blur-2xl" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-[1.8fr_1fr_1fr]">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 backdrop-blur-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300 shadow-sm shadow-emerald-500/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Trusted Financial Platform
              </div>
              <div
                data-easter-egg-logo
                role="button"
                tabIndex={0}
                aria-label="Finansia logo"
                className="mb-4 inline-flex cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus-visible:rounded-full"
              >
                <img
                  src="/logo.png"
                  alt="Finansia Logo"
                  className="h-12 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="max-w-xl text-sm leading-6 text-neutral-300">Finansia memberdayakan profesional keuangan melalui dashboard terintegrasi, insight real-time, serta sistem keamanan yang dirancang khusus untuk kebutuhan fintech.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 backdrop-blur-xl">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Governance
              </h4>
              <div className="space-y-3 text-sm text-neutral-400">
                <p className="font-medium text-neutral-100">Policy & compliance</p>
                <p className="leading-6">
                  User data is encrypted end-to-end and utilized solely for Finansia platform operations.
                </p>
                <p className="text-neutral-500">
                  Kebijakan ini mencerminkan standar fintech modern dan transparansi enterprise.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 backdrop-blur-xl">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Support & contact
              </h4>
              <div className="space-y-4 text-sm text-neutral-300">
                <p className="font-medium text-neutral-100">fachrinandrasyahputra@gmail.com</p>
                <p className="leading-6 text-neutral-400">
                  Tim dukungan siap membantu integrasi dan pertanyaan penggunaan.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="rounded-full border border-emerald-500/25 bg-white/5 px-3 py-1">Secure authentication</span>
                <span className="rounded-full border border-emerald-500/25 bg-white/5 px-3 py-1">Enterprise-ready</span>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 border-t border-neutral-800 pt-6 text-sm text-neutral-500 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p>© 2026 Finansia Inc.</p>
              <span className="hidden sm:inline">•</span>
              <p className="text-neutral-400">Developed by Fachri.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
              <span className="text-emerald-300">Indonesia</span>
              <span className="hidden sm:inline">•</span>
              <span>Global financial infrastructure</span>
            </div>
          </div>
        </div>
      </footer>
      <EasterEggTrigger />
    </div>
  );
}
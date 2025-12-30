import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      <div className="container flex max-w-4xl flex-col items-center gap-8 px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
          Internode Auth
        </h1>
        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          A simple Next.js application demonstrating authentication using Better Auth and MongoDB.
        </p>

        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-full bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:ring-white/20 dark:hover:bg-white/20"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

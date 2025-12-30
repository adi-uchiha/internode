"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function UserCard({ session }: { session: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name}
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {session.user.name}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {session.user.email}
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-700">
        <h4 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Session Info
        </h4>
        <pre className="overflow-auto rounded bg-gray-50 p-4 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-300">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        Sign Out
      </button>
    </div>
  );
}

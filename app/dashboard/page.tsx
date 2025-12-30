import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UserCard from "./user-card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <h3 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
          Whereas disregard and contempt for human rights have resulted
        </h3>
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Welcome back!
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            This is a protected page. You can only see this if you are logged in.
          </p>

          <UserCard session={session} />
        </div>
      </div>
    </div>
  );
}

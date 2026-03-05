"use client";

import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuthContext();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Host Blacklist</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p className="text-gray-600">
          Welcome, {profile?.full_name || "User"}. This is a protected page.
        </p>
        <div className="mt-4 p-4 bg-white rounded-lg border">
          <h3 className="font-semibold mb-2">Your Profile</h3>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="inline text-gray-500">Email: </dt>
              <dd className="inline">{user?.email}</dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Name: </dt>
              <dd className="inline">{profile?.full_name || "Not set"}</dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Company: </dt>
              <dd className="inline">
                {profile?.company_name || "Not set"}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}

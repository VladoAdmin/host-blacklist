import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Host Blacklist</h1>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">
          Protect Your Property from Problem Guests
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Community-driven platform where hosts share and search guest history.
          Check guests before confirming reservations.
        </p>
        <Link href="/register">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Checking Guests — Free
          </Button>
        </Link>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Search in Seconds</h3>
            <p className="text-gray-600 text-sm">
              Enter a guest name or email. See reports from other hosts
              instantly.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Share Experiences</h3>
            <p className="text-gray-600 text-sm">
              Report problem guests. Help other hosts avoid damage, theft, and
              fraud.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Community-Driven</h3>
            <p className="text-gray-600 text-sm">
              Built by hosts, for hosts. Flag false reports. Quality over
              quantity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

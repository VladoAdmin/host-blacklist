import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-sentinel-bg px-4">
      <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
      <p className="text-sentinel-muted mb-6">Stránka nebola nájdená / Page not found</p>
      <Link
        href="/"
        className="text-sentinel-accent hover:underline font-medium"
      >
        Späť na úvod / Back to home
      </Link>
    </div>
  );
}

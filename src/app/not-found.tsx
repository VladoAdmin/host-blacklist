import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-600 mb-6">Stránka nebola nájdená / Page not found</p>
      <Link
        href="/"
        className="text-blue-600 hover:underline font-medium"
      >
        Späť na úvod / Back to home
      </Link>
    </div>
  );
}

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="p-4 text-center">
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <button
          onClick={() => reset()}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Try again
        </button>
      </body>
    </html>
  );
}

// app/login/layout.tsx

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-[#121212]">
      <div className="w-full max-w-sm px-6 py-10">
        {/* bigger wordmark */}
        <div className="mb-8 flex justify-center">
          <img
            src="/logo-wordmark-light.svg"
            alt="xTrack"
            className="h-20 sm:h-24 md:h-28 dark:hidden select-none"
            draggable={false}
          />
          <img
            src="/logo-wordmark-dark.svg"
            alt="xTrack"
            className="h-20 sm:h-24 md:h-28 hidden dark:block select-none"
            draggable={false}
          />
        </div>

        {children}
      </div>
    </div>
  );
}

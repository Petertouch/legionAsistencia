import Image from "next/image";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-arena">
      {/* Minimal header */}
      <header className="bg-jungle-dark border-b border-white/10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <Image src="/images/logo.svg" alt="Legion Juridica" width={28} height={28} />
          <div className="flex items-center gap-1">
            <span className="text-white font-black text-sm tracking-[0.12em]">LEGION</span>
            <span className="text-oro font-black text-sm tracking-[0.12em]">JURIDICA</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-xs">
        <p>Legion Juridica &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

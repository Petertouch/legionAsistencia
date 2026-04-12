import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-panel flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image src="/images/logo.svg" alt="Legion Juridica" width={40} height={40} />
          <div className="flex items-center gap-1">
            <span className="text-gray-900 font-black text-xl tracking-[0.15em]">LEGION</span>
            <span className="text-oro font-black text-xl tracking-[0.15em]">JURIDICA</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

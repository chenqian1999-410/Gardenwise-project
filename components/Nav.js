import Link from "next/link";
import { Leaf } from "lucide-react";

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#d7c9a7] bg-[#f4efe2]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 font-serif text-xl uppercase tracking-[0.08em] text-[#251f18]">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#7b6f43] text-[#fff8e8] ring-4 ring-[#eee6d5]">
            <Leaf size={19} aria-hidden="true" />
          </span>
          GardenWise AI
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#4f493d]">
          <Link className="rounded-md px-3 py-2 hover:bg-[#fff8e8]" href="/styles">
            Styles
          </Link>
          <Link className="rounded-md bg-[#6f7441] px-4 py-2 text-[#fff8e8] hover:bg-[#4f5f3e]" href="/project">
            New Plan
          </Link>
        </div>
      </nav>
    </header>
  );
}

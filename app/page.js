import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { Nav } from "@/components/Nav";

export default function HomePage() {
  return (
    <main>
      <Nav />
      <section className="relative grid min-h-[calc(100vh-65px)] place-items-center overflow-hidden px-6 py-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/style-images/california-native.png')" }}
        />
        <div className="absolute inset-0 bg-[#182018]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(237,226,199,0.26),transparent_28%),radial-gradient(circle_at_78%_70%,rgba(104,119,63,0.24),transparent_34%)]" />

        <div className="relative w-full max-w-3xl rounded-lg border border-[#d7c9a7] bg-[#f4efe2]/95 px-7 py-10 text-center text-[#251f18] shadow-soft md:px-14 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6f7441]">Bay Area Zone 10a</p>
          <h1 className="mx-auto mt-5 max-w-2xl font-serif text-6xl font-normal leading-none tracking-[-0.01em] md:text-8xl">
            GardenWise AI
          </h1>
          <div className="mx-auto mt-7 grid h-14 w-14 place-items-center rounded-full bg-[#7b6f43] text-[#f7f1df] ring-8 ring-[#f4efe2]">
            <Leaf size={24} aria-hidden="true" />
          </div>
          <p className="mx-auto mt-8 max-w-xl font-serif text-2xl leading-9 text-[#332b22] md:text-3xl">
            A softer way to compose low-water residential gardens.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#4f493d]">
            Upload a plan, choose a planting mood, and generate a Bay Area proposal with coverage logic and realistic rendering.
          </p>
          <Link
            href="/project"
            className="focus-ring mt-9 inline-flex items-center gap-2 rounded-md bg-[#6f7441] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#fff8e8] hover:bg-[#4f5f3e]"
          >
            Start next step <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

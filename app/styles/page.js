import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { gardenStyles } from "@/lib/styles";

export default function StylesPage() {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f7441]">Design language</p>
        <h1 className="mt-5 max-w-3xl font-serif text-6xl font-normal leading-none text-[#251f18] md:text-8xl">Five landscape moods for a low-water Bay Area garden.</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#4f493d]">
          These model-generated references guide plant character, spatial hierarchy, and rendering atmosphere.
        </p>
        <Link href="/project" className="focus-ring mt-10 inline-flex items-center gap-2 rounded-md bg-[#6f7441] px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#fff8e8] hover:bg-[#4f5f3e]">
          Start with a style <ArrowRight size={18} aria-hidden="true" />
        </Link>

        <div className="mt-14 overflow-hidden rounded-lg border border-[#d7c9a7] bg-[#6f7441] shadow-soft">
          <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-5">
            {gardenStyles.map((style, index) => (
              <article key={style.id} className="group relative min-h-80 overflow-hidden border-b border-white/10 md:border-b-0 md:border-r">
                <img src={style.image} alt={`${style.name} reference`} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-ink/40 transition group-hover:bg-ink/20" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">0{index + 1}</p>
                  <h2 className="mt-2 font-serif text-3xl leading-tight">{style.name}</h2>
                </div>
              </article>
            ))}
          </div>
          <div className="border-t border-white/10 p-6 text-white md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Style references</p>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
              The five moods stay visible in one window so users can compare atmosphere, planting density, and hardscape character before generating a plan.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

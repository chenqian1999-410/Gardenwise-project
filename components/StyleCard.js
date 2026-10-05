import { Check } from "lucide-react";

export function StyleCard({ style, selected, onSelect }) {
  const content = (
    <div className={`group overflow-hidden rounded-lg border bg-white text-left text-ink transition ${selected ? "border-moss ring-4 ring-moss/20" : "border-ink/10 hover:border-moss/50"}`}>
      <div className="relative aspect-[16/9] bg-fog">
        <img src={style.image} alt={`${style.name} reference`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        {selected ? (
          <span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white text-moss">
            <Check size={18} aria-hidden="true" />
          </span>
        ) : null}
        <p className="absolute bottom-4 left-4 max-w-[80%] text-2xl font-semibold text-white">{style.name}</p>
      </div>
      <div className="p-6">
        <p className="max-w-3xl text-sm leading-6 text-ink/60">{style.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {style.characteristics.map((tag) => (
            <span key={tag} className="rounded-md bg-fog px-2.5 py-1 text-xs font-medium text-ink/60">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (!onSelect) return content;

  return (
    <button type="button" className="focus-ring block w-full rounded-lg" onClick={() => onSelect(style.id)}>
      {content}
    </button>
  );
}

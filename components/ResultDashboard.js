"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Download, ImageIcon, Loader2, Maximize2, MapPin, MessageCircle, RefreshCw, Send, Sparkles, X } from "lucide-react";

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [String(value)];
}

export function ResultDashboard({ result, planImageDataUrl, imageModel }) {
  const [selectedPlants, setSelectedPlants] = useState([]);
  const [render, setRender] = useState(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderNotes, setRenderNotes] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (result?.plantSchedule) {
      setSelectedPlants(asArray(result.plantSchedule).map((plant) => plant.botanical_name).filter(Boolean));
      setRender(null);
      setRenderNotes("");
      setLightboxOpen(false);
    }
  }, [result]);

  const selectedPlantRows = useMemo(() => asArray(result?.plantSchedule).filter((plant) => selectedPlants.includes(plant.botanical_name)), [result, selectedPlants]);
  if (!result) return null;

  const coveragePercent = result.coverage.requiredCoverage ? Math.round((result.coverage.totalCoverage / result.coverage.requiredCoverage) * 100) : 0;
  const renderSrc = render?.publicPath || render?.imageUrl;
  const hasPlanImage = typeof planImageDataUrl === "string" && planImageDataUrl.startsWith("data:image/");

  function togglePlant(botanicalName) {
    setSelectedPlants((current) => current.includes(botanicalName) ? current.filter((name) => name !== botanicalName) : [...current, botanicalName]);
  }

  function buildRenderPrompt() {
    const selected = selectedPlantRows.map((plant) => `${plant.quantity}x ${plant.common_name || plant.botanical_name}`).join(", ");
    const geometryInstructions = hasPlanImage
      ? [
          "Use the uploaded architectural garden plan as the exact source drawing for geometry.",
          "Preserve the full residence footprint and complete visible roof, garage, driveway, walkways, hardscape boundaries, side yards, and planting-area proportions from the plan.",
          "The complete building roof must remain visible and fully inside the image frame. Show the entire property composition without cropping the roof, house, driveway, or main planting areas."
        ]
      : [
          "Create a clearly conceptual residential garden visualization because no usable site-plan image was supplied.",
          "Do not claim that the imagined residence, roof, driveway, boundaries, or proportions match the user's property.",
          "Keep the complete imagined house, roof, driveway, and main planting areas visible inside the frame without cropping."
        ];
    return [
      ...geometryInstructions,
      `Create one polished photorealistic landscape rendering for a ${result.style.name}.`,
      `Render the selected low-water plants as realistic mature planting masses: ${selected}.`,
      "No text labels, zoning boxes, UI, diagrams, or overlays.",
      "Camera: elevated 3/4 architectural visualization showing the full plan relationship, professional landscape portfolio quality, natural daylight.",
      renderNotes ? `Approved design adjustments: ${renderNotes}` : ""
    ].filter(Boolean).join("\n");
  }

  async function generateRealRendering() {
    setRenderLoading(true);
    setRender(null);
    try {
      const response = await fetch("/api/render-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageModel, planImageDataUrl, renderPrompt: buildRenderPrompt(), selectedPlants: selectedPlantRows, style: result.style, additionalRequirements: renderNotes })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The rendering could not be generated.");
      setRender(payload);
    } catch (error) {
      setRender({ error: error.message || "The rendering could not be generated." });
    } finally {
      setRenderLoading(false);
    }
  }

  function applyDesignDirection(direction) {
    setRenderNotes((current) => current ? `${current}\n${direction}` : direction);
  }

  return (
    <section className="relative space-y-14 pb-20 text-[#30271c]">
      <header className="border-y border-[#a89369] bg-[#f9f3e7]/95 py-10 md:px-10">
        <p className="label">GardenWise proposal / 01</p>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
          <div><h2 className="max-w-3xl font-serif text-5xl leading-none md:text-6xl">{result.style.name}</h2><p className="mt-5 max-w-3xl text-base leading-8 text-[#625747]">{result.concept}</p></div>
          <button className="focus-ring inline-flex items-center gap-2 border border-[#8e9368] px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#59603f] hover:bg-[#e4d9c2]"><Download size={16} aria-hidden="true" /> Export</button>
        </div>
        {result.aiWarning ? <p className="mt-5 text-sm text-clay">{result.aiWarning}</p> : null}
        <div className="mt-10 grid border-y border-[#c8b995] md:grid-cols-4 md:divide-x md:divide-[#c8b995]">
          <Metric label="Planting area" value={`${result.siteSummary.plantingArea} sq ft`} />
          <Metric label="Required coverage" value={`${result.coverage.requiredCoverage} sq ft`} />
          <Metric label="Palette coverage" value={`${result.coverage.totalCoverage} sq ft`} />
          <Metric label="Coverage ratio" value={`${coveragePercent}%`} />
        </div>
      </header>

      <section className={`border-y px-6 py-5 md:px-8 ${result.coverage.pass ? "border-[#9a9c70] bg-[#dfe0c2]" : "border-clay/30 bg-clay/10"}`}>
        <div className="flex items-center gap-3">{result.coverage.pass ? <CheckCircle2 className="text-[#59603f]" size={24} aria-hidden="true" /> : <CircleAlert className="text-clay" size={24} aria-hidden="true" />}<div><h3 className="font-semibold">{result.coverage.message}</h3><p className="mt-1 text-sm text-[#625747]">Standard: planting area x 50% mature plant coverage.</p></div></div>
      </section>

      <section className="border-y border-[#a89369] bg-[#f9f3e7]/95 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="label">Plant palette</p><h3 className="mt-3 font-serif text-4xl">The planting schedule</h3><p className="mt-3 text-sm leading-6 text-[#625747]">Select the plants that should appear in the final rendering.</p></div><button type="button" onClick={generateRealRendering} disabled={renderLoading || selectedPlantRows.length === 0} className="focus-ring inline-flex items-center gap-2 bg-[#59603f] px-5 py-3 text-sm font-semibold uppercase tracking-[0.09em] text-[#fffaf0] hover:bg-[#3e4a35] disabled:cursor-not-allowed disabled:opacity-60">{renderLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <ImageIcon size={16} aria-hidden="true" />} Generate rendering</button></div>
        <div className="mt-8 overflow-x-auto border-y border-[#c8b995]"><table className="w-full min-w-[1020px] text-left text-sm"><thead className="text-xs uppercase tracking-[0.12em] text-[#68704a]"><tr><th className="px-4 py-4">Use</th><th className="px-4 py-4">Botanical name</th><th className="px-4 py-4">Common name</th><th className="px-4 py-4">Type</th><th className="px-4 py-4">Qty</th><th className="px-4 py-4">Mature cover / plant</th><th className="px-4 py-4">Total cover</th><th className="px-4 py-4">Purpose</th></tr></thead><tbody className="divide-y divide-[#d9caa7]">{asArray(result.plantSchedule).map((plant) => <tr key={`${plant.botanical_name}-${plant.common_name}`} className="bg-[#fffaf0]/50"><td className="px-4 py-4"><input type="checkbox" checked={selectedPlants.includes(plant.botanical_name)} onChange={() => togglePlant(plant.botanical_name)} className="h-4 w-4 accent-moss" aria-label={`Use ${plant.common_name}`} /></td><td className="px-4 py-4 font-medium italic">{plant.botanical_name}</td><td className="px-4 py-4">{plant.common_name}</td><td className="px-4 py-4">{plant.plant_type}</td><td className="px-4 py-4">{plant.quantity}</td><td className="px-4 py-4">{plant.mature_coverage} sq ft</td><td className="px-4 py-4 font-semibold text-[#59603f]">{plant.total_coverage} sq ft</td><td className="px-4 py-4 text-[#625747]">{plant.design_purpose}</td></tr>)}</tbody></table></div>
      </section>

      <section className="grid gap-px overflow-hidden border-y border-[#a89369] bg-[#c8b995] md:grid-cols-3"><Narrative title="Design concept" body={result.styleExplanation} /><Narrative title="Seasonal character" body={result.seasonalCharacteristics} /><Narrative title="Maintenance" body={result.maintenanceSuggestions} /></section>

      <section className="border-y border-[#a89369] bg-[#f9f3e7]/95 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="label">Visual study</p><h3 className="mt-3 font-serif text-4xl">A full-site rendering</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-[#625747]">{hasPlanImage ? "The uploaded image is the geometry source. The generated frame must preserve the complete roof, house, driveway, and planted property." : "Conceptual rendering — not based on your property geometry. Upload a site-plan image to preserve the real roof, driveway, boundaries, and proportions."} Click an image to inspect its full resolution.</p></div><button type="button" onClick={generateRealRendering} disabled={renderLoading || selectedPlantRows.length === 0} className="focus-ring inline-flex items-center gap-2 border border-[#8e9368] px-5 py-3 text-sm font-semibold uppercase tracking-[0.09em] text-[#59603f] hover:bg-[#e4d9c2] disabled:cursor-not-allowed disabled:opacity-60">{renderLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}{renderSrc ? "Render another study" : hasPlanImage ? "Generate visual study" : "Generate conceptual study"}</button></div>
        <p className={`mt-5 border-l-2 p-3 text-sm ${hasPlanImage ? "border-[#59603f] bg-[#dfe0c2] text-[#3e4a35]" : "border-[#a86645] bg-[#a86645]/10 text-[#74472f]"}`}><strong>{hasPlanImage ? "Source-plan rendering:" : "Conceptual rendering:"}</strong> {hasPlanImage ? "The uploaded plan image will be sent as the geometry reference." : "No usable plan image is attached, so the generated architecture and site layout are illustrative only."}</p>
        <div className="mt-8 relative min-h-[480px] border border-[#c8b995] bg-[#ede4d1]">{renderSrc ? <button type="button" onClick={() => setLightboxOpen(true)} className="block h-full w-full cursor-zoom-in"><img src={renderSrc} alt="Generated landscape rendering" className="h-auto max-h-[900px] w-full object-contain" /><span className="absolute right-4 top-4 grid h-10 w-10 place-items-center bg-[#30271c]/85 text-[#fffaf0]"><Maximize2 size={18} aria-hidden="true" /></span></button> : <div className="grid min-h-[480px] place-items-center p-8 text-center"><div><ImageIcon className="mx-auto text-[#59603f]/50" size={44} aria-hidden="true" /><p className="mt-5 font-serif text-3xl">The image will appear here.</p><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#625747]">Choose the plants, add a note in the design dialogue, then ask the studio for a complete landscape rendering.</p></div></div>}{renderLoading ? <div className="absolute inset-0 grid place-items-center bg-[#f9f3e7]/85 backdrop-blur-sm"><div className="flex items-center gap-3 bg-[#30271c] px-5 py-4 text-sm font-semibold text-[#fffaf0]"><Loader2 className="animate-spin" size={18} aria-hidden="true" /> Building the visual study...</div></div> : null}</div>
        <label className="mt-7 grid gap-2"><span className="label">Rendering direction</span><textarea className="field min-h-28 !rounded-none !bg-[#fffaf0]" value={renderNotes} onChange={(event) => setRenderNotes(event.target.value)} placeholder="Add a rendering instruction, or use the Design dialogue to shape one with AI." /></label>
        {render?.error ? <p className="mt-4 border-l-2 border-clay bg-clay/10 p-3 text-sm text-clay">{render.error}</p> : null}
      </section>

      <section className="border-y border-[#a89369] bg-[#f9f3e7]/95 p-7 md:p-9"><div className="flex items-center gap-3"><MapPin className="text-[#59603f]" size={22} aria-hidden="true" /><h3 className="font-serif text-4xl">Spatial guidance</h3></div><div className="mt-6 grid gap-0 border-y border-[#c8b995] md:grid-cols-2 md:divide-x md:divide-[#c8b995]">{asArray(result.spatialGuidance).map((item) => <p key={item} className="border-b border-[#c8b995] p-5 text-sm leading-7 text-[#625747] even:border-b-0 md:border-b-0">{item}</p>)}</div></section>

      <DesignDialogue result={result} selectedPlants={selectedPlantRows} onApply={applyDesignDirection} />
      {lightboxOpen && renderSrc ? <div className="fixed inset-0 z-50 bg-[#1f241c]/95 p-4" role="dialog" aria-modal="true"><button type="button" onClick={() => setLightboxOpen(false)} className="focus-ring absolute right-4 top-4 bg-[#f9f3e7] p-3 text-[#30271c]" aria-label="Close full rendering"><X size={22} aria-hidden="true" /></button><div className="grid h-full place-items-center"><img src={renderSrc} alt="Generated landscape rendering full size" className="max-h-full max-w-full object-contain" /></div></div> : null}
    </section>
  );
}

function Narrative({ title, body }) { return <article className="bg-[#f9f3e7] p-7 md:p-8"><p className="label">{title}</p><p className="mt-4 text-sm leading-7 text-[#625747]">{body}</p></article>; }
function Metric({ label, value }) { return <div className="p-5"><p className="label">{label}</p><p className="mt-3 font-serif text-2xl">{value}</p></div>; }

function DesignDialogue({ result, selectedPlants, onApply }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    const conversation = [...messages, { role: "user", content: trimmed }];
    setMessages(conversation);
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/design-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed, conversation, gardenContext: { style: result.style.name, plantingArea: result.siteSummary.plantingArea, sunCondition: result.siteSummary.sunCondition, maintenance: result.siteSummary.maintenance, coverage: result.coverage }, selectedPlants }) });
      const reply = await response.json();
      if (reply.error) throw new Error(reply.error);
      setMessages((current) => [...current, { role: "assistant", content: reply.reply, directive: reply.renderDirective }]);
      onApply(reply.renderDirective);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: error.message || "The design dialogue could not connect just now." }]);
    } finally { setLoading(false); }
  }

  return <aside className="fixed bottom-5 right-5 z-40 w-[min(25rem,calc(100vw-2.5rem))] text-[#30271c]">{open ? <div className="border border-[#8e9368] bg-[#f9f3e7] shadow-[0_18px_50px_rgba(45,47,31,0.24)]"><div className="flex items-center justify-between border-b border-[#c8b995] px-5 py-4"><div className="flex items-center gap-3"><Sparkles size={18} className="text-[#59603f]" aria-hidden="true" /><div><p className="font-serif text-xl">Design dialogue</p><p className="text-xs text-[#625747]">Changes are prepared for your next rendering.</p></div></div><button type="button" onClick={() => setOpen(false)} className="p-2 text-[#625747] hover:text-[#30271c]" aria-label="Close design dialogue"><X size={18} /></button></div><div className="max-h-80 space-y-4 overflow-y-auto px-5 py-5">{messages.length === 0 ? <p className="text-sm leading-6 text-[#625747]">Ask for a quieter entrance, more shade, a stronger material palette, or a different atmosphere.</p> : messages.map((item, index) => <div key={`${item.role}-${index}`} className={item.role === "user" ? "ml-8 border-l-2 border-[#59603f] pl-3 text-sm leading-6" : "mr-5 bg-[#e9dfca] p-3 text-sm leading-6 text-[#625747]"}>{item.content}{item.directive ? <p className="mt-2 text-xs italic text-[#59603f]">Applied to next rendering.</p> : null}</div>)}{loading ? <div className="flex items-center gap-2 text-sm text-[#625747]"><Loader2 className="animate-spin" size={15} /> Considering the change...</div> : null}</div><form onSubmit={sendMessage} className="flex border-t border-[#c8b995]"><input className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-[#8e8574]" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell the garden what to become..." /><button type="submit" disabled={!message.trim() || loading} className="grid w-14 place-items-center bg-[#59603f] text-[#fffaf0] disabled:opacity-40" aria-label="Send message"><Send size={17} /></button></form></div> : <button type="button" onClick={() => setOpen(true)} className="ml-auto flex items-center gap-3 bg-[#59603f] px-5 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-[#fffaf0] shadow-[0_12px_32px_rgba(45,47,31,0.26)] hover:bg-[#3e4a35]"><MessageCircle size={19} aria-hidden="true" /> Design dialogue</button>}</aside>;
}

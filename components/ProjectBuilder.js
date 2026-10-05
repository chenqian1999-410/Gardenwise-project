"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, UploadCloud } from "lucide-react";
import { gardenStyles, styleById } from "@/lib/styles";
import { aiModels, defaultAiModel, defaultImageModel, imageModels } from "@/lib/models";
import { ResultDashboard } from "@/components/ResultDashboard";

const initialForm = {
  plantingArea: 800,
  sunCondition: "Full sun",
  maintenance: "Low",
  selectedStyle: "california-native",
  aiModel: defaultAiModel,
  imageModel: defaultImageModel,
  uploadedPlanName: ""
};

const steps = [
  { title: "Plan", kicker: "The site as found" },
  { title: "Site", kicker: "Light, scale, care" },
  { title: "Style", kicker: "The atmosphere" },
  { title: "Report", kicker: "Planting proposal" }
];

export function ProjectBuilder() {
  const [form, setForm] = useState(initialForm);
  const [activeStep, setActiveStep] = useState(0);
  const [planPreview, setPlanPreview] = useState("");
  const [planImageDataUrl, setPlanImageDataUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const stepRef = useRef(null);
  const firstRenderRef = useRef(true);

  const plantingAreaValue = Number(form.plantingArea);
  const plantingAreaIsValid = Number.isFinite(plantingAreaValue) && plantingAreaValue > 0;
  const requiredCoverage = useMemo(
    () => (plantingAreaIsValid ? Math.round(plantingAreaValue * 0.5) : null),
    [plantingAreaIsValid, plantingAreaValue]
  );
  const selectedStyle = styleById[form.selectedStyle] || gardenStyles[0];

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeStep]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "plantingArea") setRequestError("");
  }

  function selectStep(nextStep) {
    if (nextStep > 1 && !plantingAreaIsValid) {
      setActiveStep(1);
      setRequestError("Enter a planting area greater than 0 sq ft before continuing.");
      return;
    }
    setActiveStep(nextStep);
  }

  function handlePlanUpload(file) {
    if (!file) return;
    updateField("uploadedPlanName", file.name);
    if (file.type.startsWith("image/")) {
      setPlanPreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onload = () => setPlanImageDataUrl(String(reader.result || ""));
      reader.readAsDataURL(file);
    } else {
      setPlanPreview("");
      setPlanImageDataUrl("");
    }
  }

  async function generatePlan() {
    if (!plantingAreaIsValid) {
      setActiveStep(1);
      setRequestError("Enter a planting area greater than 0 sq ft before generating a proposal.");
      return;
    }
    setLoading(true);
    setRequestError("");
    setActiveStep(3);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The proposal could not be generated.");
      setResult(payload);
    } catch (error) {
      setRequestError(error.message || "The proposal could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="project-studio relative overflow-hidden py-12 md:py-20">
      <div className="studio-visual" aria-hidden="true" />
      <div className="studio-wash" aria-hidden="true" />
      <FloatingStepNav activeStep={activeStep} onSelect={selectStep} />
      <div className="relative mx-auto max-w-5xl px-6 pb-20 lg:pl-36">
        <MobileStepNav activeStep={activeStep} onSelect={selectStep} />
        <p className="label">GardenWise field notes / Bay Area zone 10a</p>

        <section ref={stepRef} className="mt-7 scroll-mt-24 border-y border-[#a89369] bg-[#f9f3e7]/95 px-0 py-9 text-[#30271c] shadow-[0_22px_60px_rgba(62,56,36,0.12)] md:px-10 md:py-12">
          {activeStep === 0 ? (
            <div className="space-y-9">
              <StepHeader eyebrow="01 / Plan" title="Start with the ground beneath the idea." body="A hand sketch, site drawing, or architectural plan is enough. An image plan also becomes the geometric reference for your final rendering." />
              <label className="focus-ring group flex min-h-80 cursor-pointer flex-col items-center justify-center border-y border-dashed border-[#a89369] bg-[#ede4d1]/55 px-7 py-12 text-center transition hover:bg-[#e4d9c2]">
                <UploadCloud size={34} className="text-[#787d56] transition group-hover:-translate-y-1" aria-hidden="true" />
                <span className="mt-5 font-serif text-3xl">{form.uploadedPlanName || "Place the garden plan here"}</span>
                <span className="mt-3 max-w-md text-sm leading-6 text-[#625747]">Site image, hand sketch, PDF plan, or architectural drawing. Upload an image format for geometry-faithful rendering; PDFs remain proposal references.</span>
                <input className="hidden" type="file" accept="image/*,.pdf" onChange={(event) => handlePlanUpload(event.target.files?.[0])} />
              </label>
              {planPreview ? <figure className="border-y border-[#a89369] bg-[#fffaf0] p-4"><img src={planPreview} alt="Uploaded garden plan preview" className="max-h-[720px] w-full object-contain" /></figure> : null}
              <p className="max-w-2xl border-l-2 border-[#787d56] pl-5 text-sm leading-7 text-[#625747]">The provided Qualifying Plant List is already part of this studio's plant library. There is nothing else to upload.</p>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="space-y-10">
              <StepHeader eyebrow="02 / Site" title="Set the living area." body="One area, one clear coverage target. The plan uses mature plant coverage equal to 50% of the planting area." />
              <div className="grid gap-9 border-y border-[#c8b995] py-9 md:grid-cols-[minmax(0,1fr)_0.85fr]">
                <label className="grid gap-3">
                  <span className="label">Planting area / sq ft</span>
                  <input className="field !rounded-none !border-x-0 !border-t-0 !bg-transparent px-0 text-5xl font-serif" type="number" min="1" step="1" required aria-invalid={!plantingAreaIsValid} aria-describedby="planting-area-help planting-area-error" value={form.plantingArea} onChange={(event) => updateField("plantingArea", event.target.value)} />
                  <span id="planting-area-help" className="text-sm text-[#625747]">Include only areas that receive new planting, not the building or hardscape.</span>
                  {!plantingAreaIsValid ? <span id="planting-area-error" role="alert" className="text-sm font-semibold text-clay">Enter a planting area greater than 0 sq ft.</span> : null}
                </label>
                <div className="border-l-0 border-[#c8b995] pl-0 md:border-l md:pl-9">
                  <p className="label">Required mature cover</p>
                  <p className="mt-3 font-serif text-6xl leading-none text-[#59603f]">{requiredCoverage ?? "—"}</p>
                  <p className="mt-2 text-sm text-[#625747]">sq ft at maturity / 50% of planting area</p>
                </div>
              </div>
              <ChoiceGroup label="Sun condition" options={["Full sun", "Partial shade", "Shade"]} value={form.sunCondition} onChange={(value) => updateField("sunCondition", value)} />
              <ChoiceGroup label="Maintenance preference" options={["Low", "Medium"]} value={form.maintenance} onChange={(value) => updateField("maintenance", value)} />
              <div className="grid gap-5 border-t border-[#c8b995] pt-8 md:grid-cols-2">
                <ModelSelect label="Writing model" value={form.aiModel} options={aiModels} onChange={(value) => updateField("aiModel", value)} />
                <ModelSelect label="Rendering model" value={form.imageModel} options={imageModels} onChange={(value) => updateField("imageModel", value)} />
              </div>
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-9">
              <StepHeader eyebrow="03 / Style" title="Choose the garden's emotional temperature." body="Treat these as a visual direction, not a rigid template. The planting palette will still respond to your site and water constraints." />
              <StyleWindow selectedStyleId={form.selectedStyle} onSelect={(styleId) => updateField("selectedStyle", styleId)} />
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div className="space-y-9">
              <StepHeader eyebrow="04 / Report" title="Make the proposal tangible." body="A structured low-water palette, mature coverage check, and a render-ready brief are waiting in the next page of the studio." />
              <div className="grid border-y border-[#c8b995] py-7 text-sm text-[#625747] md:grid-cols-3 md:divide-x md:divide-[#c8b995]">
                <SummaryLine label="Planting area" value={`${form.plantingArea} sq ft`} />
                <SummaryLine label="Required cover" value={`${requiredCoverage} sq ft`} />
                <SummaryLine label="Site conditions" value={`${form.sunCondition} / ${form.maintenance} care`} />
              </div>
              <div className="overflow-hidden border border-[#c8b995] bg-[#ede4d1]">
                <img src={selectedStyle.image} alt={`${selectedStyle.name} selected reference`} className="h-64 w-full object-cover md:h-80" />
                <div className="p-6 md:p-8"><p className="label">Selected direction</p><h2 className="mt-3 font-serif text-4xl">{selectedStyle.name}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#625747]">{selectedStyle.description}</p></div>
              </div>
              <button type="button" onClick={generatePlan} disabled={loading || !plantingAreaIsValid} className="focus-ring inline-flex min-w-60 items-center justify-center gap-2 bg-[#59603f] px-7 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#fffaf0] hover:bg-[#3e4a35] disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : null} Generate proposal
              </button>
              {requestError ? <p role="alert" className="border-l-2 border-clay bg-clay/10 p-3 text-sm text-clay">{requestError}</p> : null}
            </div>
          ) : null}

          <div className="mt-11 flex items-center justify-between border-t border-[#c8b995] pt-6">
            <button type="button" onClick={() => setActiveStep((current) => Math.max(0, current - 1))} disabled={activeStep === 0} className="focus-ring inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#625747] hover:text-[#30271c] disabled:opacity-30"><ArrowLeft size={16} aria-hidden="true" /> Previous</button>
            {activeStep < 3 ? <button type="button" onClick={() => selectStep(Math.min(3, activeStep + 1))} disabled={activeStep === 1 && !plantingAreaIsValid} className="focus-ring inline-flex items-center gap-2 bg-[#59603f] px-5 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#fffaf0] hover:bg-[#3e4a35] disabled:cursor-not-allowed disabled:opacity-50">Continue <ArrowRight size={16} aria-hidden="true" /></button> : null}
          </div>
        </section>
        {result ? <div className="mt-20 text-ink"><ResultDashboard result={result} planImageDataUrl={planImageDataUrl} imageModel={form.imageModel} /></div> : null}
      </div>
    </div>
  );
}

function StepHeader({ eyebrow, title, body }) {
  return <header><p className="label">{eyebrow}</p><h2 className="mt-4 max-w-3xl font-serif text-5xl font-normal leading-[1.02] text-[#30271c] md:text-6xl">{title}</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-[#625747]">{body}</p></header>;
}

function ChoiceGroup({ label, options, value, onChange }) {
  return <div><p className="label">{label}</p><div className="mt-4 flex flex-wrap border-y border-[#c8b995]">{options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`focus-ring flex items-center gap-2 border-r border-[#c8b995] px-5 py-4 text-sm transition last:border-r-0 ${value === option ? "bg-[#59603f] font-semibold text-[#fffaf0]" : "text-[#625747] hover:bg-[#ede4d1]"}`}>{value === option ? <Check size={15} aria-hidden="true" /> : null}{option}</button>)}</div></div>;
}

function ModelSelect({ label, value, options, onChange }) {
  return <label className="grid gap-2"><span className="label">{label}</span><select className="field !rounded-none !bg-[#fffaf0]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((model) => <option key={model.id} value={model.id}>{model.name} - {model.bestFor}</option>)}</select></label>;
}

function SummaryLine({ label, value }) {
  return <div className="px-0 py-3 md:px-5"><span className="label">{label}</span><span className="mt-2 block font-serif text-xl text-[#30271c]">{value}</span></div>;
}

function FloatingStepNav({ activeStep, onSelect }) {
  return <nav className="fixed left-7 top-1/2 z-20 hidden -translate-y-1/2 lg:block" aria-label="GardenWise steps"><div className="absolute left-[13px] top-4 h-[calc(100%-2rem)] w-px bg-[#68704a]/50" /><div className="relative space-y-9">{steps.map((step, index) => { const active = activeStep === index; return <button key={step.title} type="button" onClick={() => onSelect(index)} className="group flex items-center gap-4 text-left"><span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border text-[10px] font-semibold transition ${active ? "border-[#59603f] bg-[#59603f] text-[#fffaf0]" : "border-[#a89369] bg-[#f9f3e7] text-[#59603f]"}`}>0{index + 1}</span><span><span className={`block transition ${active ? "font-serif text-4xl leading-none text-[#30271c]" : "text-sm font-semibold text-[#625747]/60 group-hover:text-[#30271c]"}`}>{step.title}</span><span className={`mt-1 block max-w-28 text-xs leading-4 ${active ? "text-[#625747]" : "text-[#625747]/50"}`}>{step.kicker}</span></span></button>; })}</div></nav>;
}

function MobileStepNav({ activeStep, onSelect }) {
  return <nav className="mb-7 flex overflow-x-auto border-y border-[#c8b995] bg-[#f9f3e7]/80 lg:hidden" aria-label="GardenWise steps">{steps.map((step, index) => <button key={step.title} type="button" onClick={() => onSelect(index)} className={`min-w-24 px-4 py-3 text-left ${activeStep === index ? "bg-[#59603f] text-[#fffaf0]" : "text-[#625747]"}`}><span className="block text-[10px] font-semibold tracking-[0.14em]">0{index + 1}</span><span className="mt-1 block font-serif text-lg">{step.title}</span></button>)}</nav>;
}

function StyleWindow({ selectedStyleId, onSelect }) {
  const selectedStyle = styleById[selectedStyleId] || gardenStyles[0];
  return <div className="overflow-hidden border border-[#a89369] bg-[#4d553c] text-[#fffaf0]"><div className="grid min-h-[430px] grid-cols-1 md:grid-cols-5">{gardenStyles.map((style) => { const selected = selectedStyleId === style.id; return <button key={style.id} type="button" onClick={() => onSelect(style.id)} className={`group relative min-h-44 overflow-hidden border-b border-white/15 text-left last:border-b-0 md:min-h-0 md:border-b-0 md:border-r md:last:border-r-0 ${selected ? "ring-2 ring-inset ring-[#f7efdf]" : "hover:ring-1 hover:ring-inset hover:ring-white/70"}`}><img src={style.image} alt={`${style.name} reference`} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className={`absolute inset-0 ${selected ? "bg-[#283122]/15" : "bg-[#283122]/52 group-hover:bg-[#283122]/28"}`} /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-[10px] font-semibold tracking-[0.18em] text-white/70">0{gardenStyles.findIndex((item) => item.id === style.id) + 1}</p><h3 className="mt-2 font-serif text-2xl leading-tight">{style.name}</h3></div>{selected ? <span className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-[#f7efdf] text-[#59603f]"><Check size={16} aria-hidden="true" /></span> : null}</button>; })}</div><div className="border-t border-white/15 p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">Current direction</p><h3 className="mt-3 font-serif text-4xl">{selectedStyle.name}</h3><p className="mt-4 max-w-3xl text-sm leading-7 text-white/75">{selectedStyle.description}</p></div></div>;
}

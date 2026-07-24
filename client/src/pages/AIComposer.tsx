import { useEffect, useState } from "react";
import { dummyGenerationData, PLATFORMS } from "../assets/assets";
import {
  History,
  Loader2,
  X,
  ArrowRightIcon,
  Calendar as CalendarIcon,
  Clock,
  Timer,
} from "lucide-react";

type Generation = {
  _id: string;
  user: string;
  prompt: string;
  content: string;
  mediaUrl: string;
  mediaType?: string;
  tone: string;
  createdAt: string;
  updatedAt: string;
};

const TONES = ["Professional", "Creative", "Funny", "Minimalist", "Excited"];

const AIComposer = () => {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generateImage, setGenerateImage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);

  // Scheduling state
  const [activeScheduler, setActiveScheduler] = useState<Generation | null>(
    null,
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const fetchGenerations = async () => {
    setGenerations(dummyGenerationData as Generation[]);
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });

  const handleGenerate = () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    // placeholder for real generation call
    setTimeout(() => setLoading(false), 1800);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const openScheduler = (gen: Generation) => {
    setActiveScheduler(gen);
    setSelectedPlatforms([]);
    setScheduledDate("");
    setScheduledTime("");
  };

  const closeScheduler = () => {
    if (scheduling) return;
    setActiveScheduler(null);
  };

  const confirmSchedule = () => {
    if (!selectedPlatforms.length || !scheduledDate || !scheduledTime) return;
    setScheduling(true);
    setTimeout(() => {
      setScheduling(false);
      setActiveScheduler(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* ---------- Composer ---------- */}
        <h1 className="text-center text-3xl  tracking-tight text-slate-700">
          What should we create today?
        </h1>

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Share your idea... (e.g. A post about the launch of our new eco-friendly coffee beans)"
            rows={4}
            className="w-full resize-none bg-transparent text-[16px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />

          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setGenerateImage((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-red-50 py-2 pl-3 pr-1.5 text-sm text-slate-800"
            >
              {/* <ImageIcon className="h-4 w-4 text-slate-400" /> */}
              AI Image
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  generateImage ? "bg-red-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute left-0 top-[2.4px] h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    generateImage ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ---------- Tone pills ---------- */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTone(t)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                tone === t
                  ? "border-red-500 bg-red-500 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ---------- Recent generations ---------- */}
        <div className="mt-12 pt-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <History className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg">Recent Generations</h2>
            </div>
            <span className="text-sm text-slate-400">
              {generations.length} total
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {generations.map((gen) => (
              <div
                key={gen._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-red-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between px-4 pt-4">
                  <span className="text-xs text-slate-400">
                    {formatDate(gen.createdAt)}
                  </span>
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500">
                    {gen.tone}
                  </span>
                </div>

                <p
                  className={`mt-3 px-4 text-sm leading-relaxed text-slate-700 ${
                    gen.mediaUrl ? "line-clamp-3" : "line-clamp-10"
                  }`}
                >
                  {gen.content}
                </p>

                {gen.mediaUrl && (
                  <div className="mt-3 px-4">
                    <img
                      src={gen.mediaUrl}
                      alt={gen.prompt}
                      className="h-40 w-full rounded-lg object-cover"
                    />
                  </div>
                )}

                <div className="mt-auto px-4 pb-4 pt-4">
                  <button
                    type="button"
                    onClick={() => openScheduler(gen)}
                    className="w-full rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-500 hover:text-white"
                  >
                    Schedule Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Schedule modal ---------- */}
      {activeScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="text-base text-slate-800">
                Schedule Generation
              </h3>
              <button
                type="button"
                onClick={closeScheduler}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content preview */}
            <div className="overflow-y-auto bg-slate-50 p-8">
              <p className="whitespace-pre-line text-base leading-relaxed text-slate-600">
                {activeScheduler.content}
              </p>
            
              {activeScheduler.mediaUrl && (
                <img
                  src={activeScheduler.mediaUrl}
                  alt={activeScheduler.prompt}
                  className="mt-4 w-full rounded-xl object-cover"
                />
              )}
            </div>

            {/* Actions section */}
            <div className="border-t border-slate-100 px-8 py-5 pb-8">
              <p className="text-xs tracking-wide text-slate-400">
                SELECT CHANNELS
              </p>

              <div className="mt-3 flex flex-wrap gap-3">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? "border-red-500 bg-red-500 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm text-slate-700 focus:border-red-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm text-slate-700 focus:border-red-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={confirmSchedule}
                disabled={
                  scheduling ||
                  !selectedPlatforms.length ||
                  !scheduledDate ||
                  !scheduledTime
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Timer className="h-4 w-4" />
                    Schedule Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIComposer;

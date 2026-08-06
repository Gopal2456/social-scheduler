import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  ArrowRight,
  Send,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { PLATFORMS } from "../assets/assets";
import api from "../api/axios";
import toast from "react-hot-toast";

const CHAR_LIMIT = 280;

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const truncate = (text: string, max = 140) =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text;

const Scheduler = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get("/api/posts");
      setPosts(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    (async () => fetchPosts())();
    const interval = setInterval(async () => await fetchPosts(), 10000);
    return () => clearInterval(interval);
  }, []);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId],
    );
  };

  const handleMediaClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      }
    };
    input.click();
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview(null);
  };

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const handleSchedulePost = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      toast.error("Select date and time");
      return;
    }
    if (selectedPlatforms.includes("instagram") && !mediaFile) {
      toast.error("Instagram requires an image or video");
      return;
    }

    const scheduledFor = new Date(
      `${scheduleDate}T${scheduleTime}`,
    ).toISOString();
    const formData = new FormData();
    formData.append("content", content);
    formData.append("scheduledFor", scheduledFor);
    formData.append("status", "scheduled");
    formData.append("platform", JSON.stringify(selectedPlatforms));
    if (mediaFile) formData.append("media", mediaFile);

    setLoading(true);

    try {
      await api.post("/api/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Post scheduled!");
      setContent("");
      setScheduleDate("");
      setScheduleTime("");
      setSelectedPlatforms([]);
      setMediaFile(null);
      fetchPosts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const upcoming = posts.filter((p) => p.status === "scheduled");
  const published = posts.filter((p) => p.status === "published");

  const getPlatform = (id: string) =>
    PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[1];

  const PostCard = ({ post }: { post: any }) => {
    const platform = getPlatform(post.platforms?.[0]);
    const Icon = platform.icon;
    const isPublished = post.status === "published";

    return (
      <div className="border-b border-gray-100 last:border-b-0 px-6 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500">
            <Icon size={16} />
          </div>
          <div className="flex items-center gap-2">
            {post.mediaType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 ">
                {post.mediaType === "image" ? "Image" : "Video"}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {formatDateTime(post.scheduledFor)}
            </span>
            {isPublished && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 ">
                Published
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          {truncate(post.content)}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-6">
        {/* Compose Post */}
        <div className="bg-white rounded-2xl border border-gray-200  p-6 h-fit">
          <h2 className="text-lg text-gray-700 mb-6">Compose Post</h2>

          <div className="mb-6">
            <label className="text-xs  tracking-wide text-gray-400 uppercase mb-2 block">
              Platforms
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    title={platform.name}
                    className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-red-50 border-red-300 text-red-500"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                    aria-pressed={isSelected}
                    aria-label={platform.name}
                  >
                    <Icon size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs tracking-wide text-gray-400 uppercase mb-2 block">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, CHAR_LIMIT))}
              placeholder="What do you want to share today?"
              rows={6}
              className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {content.length}/{CHAR_LIMIT}
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs tracking-wide text-gray-400 uppercase mb-2 block">
              Media (optional)
            </label>

            {mediaPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                {mediaFile?.type.startsWith("video") ? (
                  <video
                    src={mediaPreview}
                    className="w-full h-48 object-cover"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Media preview"
                    className="w-full h-48 object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  aria-label="Remove media"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMediaClick}
                className="w-full rounded-lg border-2 border-dashed border-gray-200 py-8 flex flex-col items-center justify-center gap-2 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
              >
                <ImageIcon size={18} />
                Click to upload image or video
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="text-xs  tracking-wide text-gray-400 uppercase mb-2 block">
                Date
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-lg bg-white border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs  tracking-wide text-gray-400 uppercase mb-2 block">
                Time
              </label>
              <div className="relative">
                <Clock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-lg bg-white border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSchedulePost}
            disabled={
              loading || !content.trim() || selectedPlatforms.length === 0
            }
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white  rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? "Scheduling..." : "Schedule Post"}
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Upcoming + Published */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200  overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 ">
                <Calendar size={16} className="text-gray-500" />
                Upcoming
              </div>
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs  flex items-center justify-center">
                {upcoming.length}
              </span>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-6 py-6 text-sm text-center text-gray-400">
                No posts scheduled yet.
              </p>
            ) : (
              upcoming.map((post) => <PostCard key={post._id} post={post} />)
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-800 ">
                <Send size={16} className="text-gray-500" />
                Published
              </div>
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                {published.length}
              </span>
            </div>
            {published.length === 0 ? (
              <p className="px-6 py-6 text-sm text-center text-gray-400">
                No published posts yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {published.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scheduler;

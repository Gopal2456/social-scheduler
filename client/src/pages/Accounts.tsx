import {
  CheckCircleIcon,
  ExternalLinkIcon,
  Unplug,
  PlusIcon,
  XIcon,
  Plus,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PLATFORMS } from "../assets/assets";
import { toast } from "react-hot-toast";
import api from "../api/axios";

const Accounts = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connection, setConnection] = useState<string | null>(null);

  const fetchAccounts = async (
    isSync = false,
    platform?: string | null,
    successMsg?: string,
  ) => {
    setIsLoading(true);
    try {
      if (isSync) {
        const label = platform
          ? platform.charAt(0).toUpperCase() + platform.slice(1)
          : "Social Media";
        toast.loading(`Syncing ${label} accounts...`, { id: "sync" });
        await api.get("/api/oauth/sync");
        toast.success(successMsg || `Accounts synced successfully!`, {
          id: "sync",
        });
      }
      const { data } = await api.get("/api/accounts");
      setAccounts(data);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch accounts.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedPlatform = params.get("connected");
    const connectedUsername = params.get("username");
    const syncNeeded = params.get("sync") === "true";
    const errorMsg = params.get("error");

    window.history.replaceState({}, document.title, window.location.pathname);
    if (connectedPlatform) {
      const label =
        connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1);
      const handle = connectedUsername ? `@${connectedUsername}` : "";
      fetchAccounts(
        true,
        connectedPlatform,
        `${label} account ${handle} connected successfully!`,
      );
    } else if (errorMsg) {
      toast.error(`Connection failed: ${decodeURIComponent(errorMsg)}`);
      fetchAccounts();
    } else if (syncNeeded) {
      fetchAccounts(true, null, "Accounts synced successfully!");
    } else {
      fetchAccounts();
    }
  }, []);

  const isConnected = (platformId: string) =>
    accounts.some((a) => a.platform === platformId);

  const handleConnect = async (platformId: string) => {
    setConnection(platformId);
    try {
      const { data } = await api.get(`/api/oauth/${platformId}/url`);
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          `Failed to connect ${platformId}`,
      );
      setConnection(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await api.delete(`/api/accounts/${accountId}`);
      toast.success("Account disconnected");
      await fetchAccounts();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to disconnect account",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Connected Accounts
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 sm:text-base">
            {accounts.length} of {PLATFORMS.length} platforms connected
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 sm:w-auto"
        >
          <PlusIcon className="size-4" />
          Connect Account
        </button>
      </div>

      {/* connected accounts grid */}
      {accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <button>
              <Plus
                onClick={() => setIsModalOpen(true)}
                className="h-6 w-6 text-rose-500"
                strokeWidth={1.75}
              />
            </button>
          </div>

          <h3 className="text-base font-semibold text-slate-800">
            No accounts connected
          </h3>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
            Connect your social accounts to schedule posts and track performance
            from one place.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((account) => {
          const platform = PLATFORMS.find((p) => p.id === account.platform);

          if (!platform) return null;

          const Icon = platform.icon;
          return (
            <div
              key={account._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icon className="size-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{account.handle}</p>
                  <p className="text-sm text-slate-500">{platform.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm text-emerald-600 font-medium">
                  <CheckCircleIcon className="size-4" />
                  Connected
                </span>
                <button
                  onClick={() => handleDisconnect(account._id)}
                  aria-label={`Disconnect ${account.platform}`}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Unplug className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10 text-sm text-slate-400">
          Loading accounts…
        </div>
      )}

      {/* connect platform modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                Choose a Platform
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {PLATFORMS.map((platform) => {
                const connected = isConnected(platform.id);
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleConnect(platform.id)}
                    disabled={connected || connection === platform.id}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors ${
                      connected
                        ? "bg-red-50 cursor-default"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          connected ? "bg-red-500" : "bg-slate-100"
                        }`}
                      >
                        <Icon
                          className={`size-4 ${
                            connected ? "text-white" : "text-slate-700"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`font-medium ${connected ? "text-red-600" : "text-slate-900"}`}
                        >
                          {platform.name}
                        </p>
                        <p
                          className={`text-sm ${connected ? "text-red-400" : "text-slate-500"}`}
                        >
                          {connected
                            ? "Already connected"
                            : platform.description}
                        </p>
                      </div>
                    </div>
                    {connection === platform.id ? (
                      <LoaderCircle className="size-5 text-red-500 animate-spin shrink-0" />
                    ) : connected ? (
                      <CheckCircleIcon className="size-5 text-red-500 shrink-0" />
                    ) : (
                      <ExternalLinkIcon className="size-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;

import {
  CheckCircleIcon,
  ExternalLinkIcon,
  Unplug,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { dummyAccountsData, PLATFORMS } from "../assets/assets";

interface ConnectedAccount {
  _id: string;
  zernioAccountId: string;
  handle: string;
  platform: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: string;
}

const Accounts = () => {
  // Seed state straight from dummyAccountsData instead of a hardcoded duplicate array
  const [accounts, setAccounts] =
    useState<ConnectedAccount[]>(dummyAccountsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = async (
    isSync = false,
    platform?: string | null,
    successMsg?: string,
  ) => {
    setIsLoading(true);
    try {
      const data = platform
        ? dummyAccountsData.filter((a) => a._id === platform)
        : dummyAccountsData;

      setAccounts(data);

      if (isSync && successMsg) {
        console.log(successMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const isConnected = (platformId: string) =>
    accounts.some((a) => a.platform === platformId);

  type Platform = (typeof PLATFORMS)[number];

  const handleConnect = (platform: Platform) => {
    if (isConnected(platform.id)) return;

    setAccounts((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(),
        zernioAccountId: crypto.randomUUID(),
        handle: "greatstack",
        platform: platform.id,
        status: "connected",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: "demo-user",
      },
    ]);

    setIsModalOpen(false);
  };

  const handleDisconnect = (_id: string) => {
    setAccounts((prev) => prev.filter((a) => a._id !== _id));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Connected Accounts
          </h2>
          <p className="text-slate-500 mt-0.5">
            {accounts.length} of {PLATFORMS.length} platforms connected
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-medium text-sm px-5 py-2.5 rounded-full transition-colors"
        >
          <PlusIcon className="size-4" />
          Connect Account
        </button>
      </div>

      {/* connected accounts grid */}
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

      {isLoading && <div></div>}

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
                    onClick={() => handleConnect(platform)}
                    disabled={connected}
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
                    {connected ? (
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

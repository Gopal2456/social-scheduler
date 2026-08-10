import zernio from "../config/zernio.js";
import { User } from "../models/user.js";
import { Account } from "../models/Accounts.js";
// Help to ensure user has a zernio profile
const getOrCreateZernioProfile = async (user) => {
    try {
        const result = await zernio.profiles.listProfiles();
        const data = result.data;
        const profiles = Array.isArray(data)
            ? data
            : data?.profiles || data?.data || [];
        if (profiles.length > 0) {
            const pid = profiles[0]._id || profiles[0].id;
            await User.findByIdAndUpdate(user._id, { zernioProfileId: pid });
            return pid;
        }
        const createResult = await zernio.profiles.createProfile({
            body: { name: `${user.name || user.email}'s workspace` },
        });
        const created = createResult.data?.profiles || createResult.data;
        const pid = created?._id || created?.id;
        if (!pid) {
            throw new Error("Failed to create Zernio profile - no ID returned");
        }
        await User.findByIdAndUpdate(user._id, { zernioProfileId: pid });
        return pid;
    }
    catch (error) {
        console.error("generateOrCreateZernioProfile Error:", error?.message || error);
        throw error;
    }
};
// Generate OAuth authorization URL
// Get /api/auth/:platform
export const generateAuthUrl = async (req, res) => {
    try {
        const { platform } = req.params;
        const profileId = await getOrCreateZernioProfile(req.user);
        const origin = req.headers.origin;
        const redirectUrl = `${origin}/accounts`;
        const result = await zernio.connect.getConnectUrl({
            path: { platform: platform },
            query: {
                profileId,
                redirectUrl: redirectUrl,
            },
        });
        const data = result.data;
        console.log("getConnectUrl response:", JSON.stringify(data, null, 2));
        const authUrl = data.authUrl;
        if (!authUrl) {
            throw new Error(`Zernio returned no authUrl. Full response: ${JSON.stringify(data, null, 2)}`);
        }
        res.json({ url: authUrl });
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};
// Sync connected accounts from zernio into Mongo
//GET /api/auth/sync
export const syncAccounts = async (req, res) => {
    try {
        const profileId = await getOrCreateZernioProfile(req.user);
        const result = await zernio.accounts.listAccounts({
            query: { profileId },
        });
        const data = result.data;
        const zernioAccounts = Array.isArray(data)
            ? data
            : Array.isArray(data?.accounts)
                ? data.accounts
                : Array.isArray(data?.data)
                    ? data.data
                    : [];
        const supportedPlatforms = ["twitter", "linkedin", "facebook", "instagram"];
        const syncAccounts = [];
        for (const zAccount of zernioAccounts) {
            const zid = zAccount._id || zAccount.id;
            if (!zid) {
                console.warn("Skipping account with no ID: ", zAccount);
                continue;
            }
            const rawPlatform = (zAccount.platform ||
                zAccount.type ||
                "").toLowerCase();
            const normalizedPlatform = supportedPlatforms.find((p) => rawPlatform.includes(p));
            if (!normalizedPlatform) {
                console.warn(`Skipping unsupported platform: "${rawPlatform}"`);
                continue;
            }
            const account = await Account.findOneAndUpdate({ zernioAccountId: zid }, {
                user: req.user._id,
                platform: normalizedPlatform,
                handle: zAccount.username || zAccount.name || zAccount.handle || "Unknown",
                zernioAccountId: zid,
                status: "connected",
                avatarUrl: zAccount.avatarUrl ||
                    zAccount.picture ||
                    zAccount.profile_image_url,
            }, { upsert: true, returnDocument: "after" });
            syncAccounts.push(account);
        }
        res.json(syncAccounts);
    }
    catch (error) {
        res.status(500).json({ message: error?.message || "Server error" });
    }
};

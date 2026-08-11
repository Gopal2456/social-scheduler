import {
  CheckCircleIcon,
  ClockIcon,
  SendIcon,
  ShareIcon,
  TrendingUpIcon,
  ActivityIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";

interface Activity {
  id: string;
  actionType: string;
  description: string;
  createdAt: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    scheduled: 0,
    published: 0,
    connectedAccounts: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [postsResponse, accountsResponse, activitiesResponse] =
          await Promise.all([
            api.get("/api/posts"),
            api.get("/api/accounts"),
            api.get("/api/activity"),
          ]);

        const posts = postsResponse.data;
        setStats({
          scheduled: posts.filter((post: any) => post.status === "scheduled")
            .length,
          published: posts.filter((post: any) => post.status === "published")
            .length,
          connectedAccounts: accountsResponse.data.filter(
            (account: any) => account.status === "connected",
          ).length,
        });
        setActivities(activitiesResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      label: "Scheduled Posts",
      value: stats.scheduled,
      icon: ClockIcon,
      trend: "+2 today",
    },
    {
      label: "Published Posts",
      value: stats.published,
      icon: CheckCircleIcon,
      trend: "All time",
    },
    {
      label: "Connected Accounts",
      value: stats.connectedAccounts,
      icon: ShareIcon,
      trend: "Active",
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning! 👋";
    if (hour < 18) return "Good afternoon! 👋";
    return "Good evening! 👋";
  };

  return (
    <div className="min-h-screen bg-slate-50 space-y-8">
      {/* welcome bar */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          {getGreeting()}
        </h2>
        <p className="text-slate-500">
          Here's what's happening with your social accounts today.
        </p>
      </div>

      {/* stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-red-200 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl text-slate-900">{card.value}</div>
              <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                <TrendingUpIcon className="size-3.5" />
                {card.trend}
              </div>
            </div>
            <p className="text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* recent activity */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          <span className="text-sm text-slate-400">
            {activities.length} events
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <ActivityIcon className="size-7 text-slate-300" />
            </div>
            <p className="text-base font-medium text-slate-500">
              No activity yet
            </p>
            <p className="text-sm text-slate-300 mt-1.5">
              Connect accounts and schedule posts to see events here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <SendIcon className="size-4 text-slate-600" />
                  </div>
                  <div>
                    <span className="inline-block text-[11px] text-slate-600 bg-gray-100 rounded-full px-2.5 py-0.5 mb-1">
                      {activity.actionType}
                    </span>
                    <p className="text-sm text-slate-500">
                      {activity.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(activity.createdAt).toLocaleString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiBell, FiCheck, FiLoader, FiX } from "react-icons/fi";
import { fetchShopkeeperNotifications, markNotificationsRead } from "../../../../../api/Notifications";

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
};

const ShopkeeperTopbar = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["shopkeeperNotifications"],
    queryFn: () => fetchShopkeeperNotifications({ limit: 5 }),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const markMutation = useMutation({
    mutationFn: (payload) => markNotificationsRead(payload),
    onSuccess: () => queryClient.invalidateQueries(["shopkeeperNotifications"]),
  });

  useEffect(() => {
    const handleClick = (event) => {
      if (!dropdownRef.current || dropdownRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = () => {
    if (markMutation.isPending || unreadCount === 0) return;
    markMutation.mutate({ mark_all: true });
  };

  const markSingle = (id) => {
    if (markMutation.isPending) return;
    markMutation.mutate({ ids: [id] });
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400">Shopkeeper Panel</p>
          <h1 className="text-lg font-semibold text-gray-800">Welcome back! Stay on top of your customers.</h1>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="relative rounded-full border border-gray-200 bg-white p-3 text-gray-600 shadow-sm hover:text-gray-900"
          >
            {isFetching ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiBell className="h-5 w-5" />}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">Latest updates from your customers</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto px-4 py-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                    <FiLoader className="mr-2 h-4 w-4 animate-spin" /> Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    No notifications yet.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          notification.is_read ? "border-gray-100 bg-gray-50" : "border-emerald-100 bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{notification.title}</p>
                            <p className="text-gray-600">{notification.message}</p>
                          </div>
                          {!notification.is_read && (
                            <button
                              onClick={() => markSingle(notification.id)}
                              className="ml-2 rounded-full p-1 text-emerald-600 hover:bg-emerald-100"
                              title="Mark as read"
                              disabled={markMutation.isPending}
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">{formatDate(notification.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between border-t px-4 py-3 text-xs">
                <span className="text-gray-500">{unreadCount} unread</span>
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
                  disabled={markMutation.isPending || unreadCount === 0}
                >
                  <FiCheck className="h-3 w-3" /> Mark all read
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ShopkeeperTopbar;

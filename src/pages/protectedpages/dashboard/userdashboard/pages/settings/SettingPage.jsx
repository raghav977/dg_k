import React, { useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomerProfile, updateCustomerProfile } from "../../../../../../api/Profile";
import PasswordChangeCard from "../../../../../../components/PasswordChangeCard";

const SettingPage = () => {
  const queryClient = useQueryClient();
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [loanReminder, setLoanReminder] = useState(true);
  const [theme, setTheme] = useState("light");
  const [statusMessage, setStatusMessage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: fetchCustomerProfile,
  });

  useEffect(() => {
    if (data?.theme) {
      setTheme(data.theme);
    }
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = prefersDark ? "dark" : "light";
    } else {
      root.dataset.theme = theme;
    }
  }, [theme]);

  const themeMutation = useMutation({
    mutationFn: (nextTheme) => updateCustomerProfile({ theme: nextTheme }),
    onSuccess: () => {
      setStatusMessage({ type: "success", text: "Theme preference saved." });
      queryClient.invalidateQueries(["customerProfile"]);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.theme?.[0] ||
        error?.response?.data?.detail ||
        "Unable to update theme.";
      setStatusMessage({ type: "error", text: message });
    },
  });

  const handleSave = () => {
    setStatusMessage(null);
    themeMutation.mutate(theme);
  };

  const handleReset = () => {
    setEmailNotif(true);
    setSmsNotif(false);
    setLoanReminder(true);
    setTheme(data?.theme || "light");
    setStatusMessage(null);
  };

  if (isLoading && !data) {
    return <div className="p-6 text-gray-500">Loading settings...</div>;
  }

  const cardClass =
    theme === "dark"
      ? "bg-slate-900 border border-slate-800 text-slate-100"
      : "bg-white shadow text-gray-800";
  const headingClass = theme === "dark" ? "text-slate-100" : "text-gray-700";
  const subTextClass = theme === "dark" ? "text-slate-400" : "text-gray-500";
  const selectClass =
    theme === "dark"
      ? "w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
      : "w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800";

  return (
    <div className={`mx-auto space-y-6 p-6 ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-800"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className={`mt-1 text-sm ${subTextClass}`}>
            Manage your notifications, preferences and connected shops.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={themeMutation.isPending}
            className={`rounded-md px-3 py-2 text-sm text-white ${
              themeMutation.isPending ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {themeMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className={`${cardClass} rounded-xl p-6 space-y-4`}>
          <h2 className={`text-lg font-semibold ${headingClass}`}>Notifications</h2>
          <div className="divide-y divide-gray-200/30">
            <PreferenceSwitch
              title="Email Notifications"
              description="Receive updates and receipts via email."
              enabled={emailNotif}
              onChange={setEmailNotif}
              theme={theme}
            />
            <PreferenceSwitch
              title="SMS Notifications"
              description="Receive short updates via SMS."
              enabled={smsNotif}
              onChange={setSmsNotif}
              theme={theme}
            />
            <PreferenceSwitch
              title="Loan Reminders"
              description="Receive reminders for pending loan payments."
              enabled={loanReminder}
              onChange={setLoanReminder}
              theme={theme}
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className={`${cardClass} rounded-xl p-6 space-y-4`}>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Preferences</h2>
            <div className="space-y-2">
              <label className={`text-sm font-medium ${headingClass}`}>Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className={selectClass}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
              <p className={`text-xs ${subTextClass}`}>
                Choose how the dashboard should look across all pages.
              </p>
            </div>
          </section>

          <section className={`${cardClass} rounded-xl p-6 space-y-4`}>
            <h2 className={`text-lg font-semibold ${headingClass}`}>Connected Shops</h2>
            <p className={`text-sm ${subTextClass}`}>
              Manage shops you are connected with.
            </p>
            <div className="mt-2 space-y-2">
              <ConnectedShopCard name="Fresh Mart" theme={theme} />
              <ConnectedShopCard name="Coffee Corner" theme={theme} />
            </div>
          </section>
        </div>
      </div>

      <PasswordChangeCard compact theme={theme} />
    </div>
  );
};

const PreferenceSwitch = ({ title, description, enabled, onChange, theme }) => {
  const titleClass = theme === "dark" ? "text-slate-100" : "text-gray-800";
  const descClass = theme === "dark" ? "text-slate-400" : "text-gray-500";

  return (
  <div className="flex items-center justify-between py-3">
    <div>
      <div className={`text-sm font-medium ${titleClass}`}>{title}</div>
      <div className={`text-xs ${descClass}`}>{description}</div>
    </div>
    <Switch
      checked={enabled}
      onChange={onChange}
      className={`${enabled ? "bg-blue-600" : "bg-gray-200"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
    >
      <span
        className={`${enabled ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`}
      />
    </Switch>
  </div>
);
};

const ConnectedShopCard = ({ name, theme }) => (
  <div
    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
      theme === "dark" ? "border-slate-700 text-slate-100" : "border-gray-200 text-gray-700"
    }`}
  >
    <span>{name}</span>
    <button className="text-red-500 hover:underline">Disconnect</button>
  </div>
);

export default SettingPage;

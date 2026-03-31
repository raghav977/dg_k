import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { changeCustomerPassword } from "../api/Profile";
import { FiLock } from "react-icons/fi";

const PasswordChangeCard = ({
  title = "Change Password",
  description = "Update your account password.",
  compact = false,
  theme = "light",
}) => {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [feedback, setFeedback] = useState(null);

  const mutation = useMutation({
    mutationFn: (payload) => changeCustomerPassword(payload),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Password updated successfully." });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.new_password?.[0] ||
        error?.response?.data?.confirm_password?.[0] ||
        error?.response?.data?.current_password?.[0] ||
        "Unable to update password.";
      setFeedback({ type: "error", message });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);
    mutation.mutate(form);
  };

  const containerClass =
    theme === "dark"
      ? `rounded-xl border border-slate-800 bg-slate-900 p-6 shadow ${compact ? "space-y-4" : "space-y-6"}`
      : `rounded-xl border bg-white p-6 shadow ${compact ? "space-y-4" : "space-y-6"}`;

  const headingText = theme === "dark" ? "text-slate-100" : "text-gray-700";
  const subText = theme === "dark" ? "text-slate-400" : "text-gray-500";
  const inputClass =
    theme === "dark"
      ? "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
      : "mt-1 w-full rounded-lg border px-3 py-2";

  return (
    <div className={containerClass}>
      <div>
        <div className={`flex items-center gap-2 ${headingText}`}>
          <FiLock />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className={`text-sm ${subText}`}>{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={`text-sm font-medium ${headingText}`} htmlFor="current_password">
            Current Password
          </label>
          <input
            id="current_password"
            type="password"
            name="current_password"
            value={form.current_password}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={`text-sm font-medium ${headingText}`} htmlFor="new_password">
            New Password
          </label>
          <input
            id="new_password"
            type="password"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={`text-sm font-medium ${headingText}`} htmlFor="confirm_password">
            Confirm Password
          </label>
          <input
            id="confirm_password"
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          {feedback && (
            <p className={`text-sm ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {feedback.message}
            </p>
          )}
          <button
            type="submit"
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              mutation.isPending ? "bg-gray-400" : "bg-gray-800 hover:bg-gray-900"
            }`}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PasswordChangeCard;

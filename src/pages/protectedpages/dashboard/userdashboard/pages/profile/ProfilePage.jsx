import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCustomerProfile, updateCustomerProfile } from "../../../../../../api/Profile";
import PasswordChangeCard from "../../../../../../components/PasswordChangeCard";

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: fetchCustomerProfile,
  });

  useEffect(() => {
    if (data) {
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        address: data.address || "",
        bio: data.bio || "",
      });
      setPreview(data.avatar_url || null);
    }
  }, [data]);

  const profileMutation = useMutation({
    mutationFn: (payload) => updateCustomerProfile(payload),
    onSuccess: (response) => {
      setFeedback({ type: "success", text: "Profile updated successfully." });
      setAvatarFile(null);
      if (response?.avatar_url) {
        setPreview(response.avatar_url);
      }
      queryClient.invalidateQueries(["customerProfile"]);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.phone_number?.[0] ||
        "Unable to update profile.";
      setFeedback({ type: "error", text: message });
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    setAvatarFile(file || null);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else if (data?.avatar_url) {
      setPreview(data.avatar_url);
    } else {
      setPreview(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);
    const payload = new FormData();
    payload.append("first_name", form.first_name);
    payload.append("last_name", form.last_name);
    payload.append("phone_number", form.phone_number);
    payload.append("address", form.address);
    payload.append("bio", form.bio || "");
    if (avatarFile) {
      payload.append("avatar", avatarFile);
    }
    profileMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Profile</h2>

      <div className="rounded-xl bg-white p-6 shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative h-24 w-24">
              <img
                src={
                  preview ||
                  data?.avatar_url ||
                  "https://via.placeholder.com/150?text=Avatar"
                }
                alt="avatar"
                className="h-full w-full rounded-full border object-cover"
              />
            </div>
            <div>
              <label className="cursor-pointer rounded-lg border bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">
                Upload New Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">JPG, PNG — max 5MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-lg border bg-gray-100 px-3 py-2 text-gray-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                name="bio"
                rows={3}
                value={form.bio}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          {feedback && (
            <p className={`text-sm ${feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={profileMutation.isPending}
            className={`rounded-lg px-6 py-2 text-white ${
              profileMutation.isPending ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {profileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <PasswordChangeCard />
    </div>
  );
};

export default ProfilePage;

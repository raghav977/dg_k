import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiMessageSquare, FiPlus, FiSend } from "react-icons/fi";
import { fetchChatThreads, fetchChatMessages, sendChatMessage, createChatThread } from "../../../../../../api/Chat";
import { fetchConnectedShops } from "../../../../../../api/Dashboard";

const CustomerChatPage = () => {
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState(null);
  const [messageBody, setMessageBody] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["chatThreads"],
    queryFn: fetchChatThreads,
    refetchInterval: 5000,
  });

  const threads = threadsData?.threads || [];

  useEffect(() => {
    if (!selectedThread && threads.length > 0) {
      setSelectedThread(threads[0]);
    } else if (selectedThread) {
      const stillExists = threads.find((t) => t.id === selectedThread.id);
      if (!stillExists) {
        setSelectedThread(threads[0] || null);
      }
    }
  }, [threads, selectedThread]);

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["chatMessages", selectedThread?.id],
    queryFn: () => fetchChatMessages(selectedThread.id),
    enabled: Boolean(selectedThread?.id),
    refetchInterval: 5000,
  });

  const messages = messagesData?.messages || [];

  const { data: connectedShopsData } = useQuery({
    queryKey: ["connectedShopsForChat"],
    queryFn: fetchConnectedShops,
  });

  const connectedShops = useMemo(() => {
    if (!connectedShopsData) return [];
    return connectedShopsData.shops || connectedShopsData.results || connectedShopsData || [];
  }, [connectedShopsData]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ threadId, body }) => sendChatMessage(threadId, body),
    onSuccess: (_, variables) => {
      setMessageBody("");
      queryClient.invalidateQueries(["chatMessages", variables.threadId]);
      queryClient.invalidateQueries(["chatThreads"]);
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: (businessId) => createChatThread({ business_id: businessId }),
    onSuccess: (thread) => {
      setShowNewChat(false);
      setSelectedBusinessId("");
      setSelectedThread(thread);
      queryClient.invalidateQueries(["chatThreads"]);
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!selectedThread?.id || !messageBody.trim()) return;
    sendMessageMutation.mutate({ threadId: selectedThread.id, body: messageBody.trim() });
  };

  const handleCreateThread = (e) => {
    e.preventDefault();
    if (!selectedBusinessId) return;
    createThreadMutation.mutate(selectedBusinessId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Chat with shopkeeper</h1>
          <p className="text-sm text-gray-500">Send loan clarifications, orders, or questions directly.</p>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
        >
          <FiPlus />
          Start chat
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Shops</h2>
            <span className="text-xs text-gray-400">{threads.length}</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {threadsLoading ? (
              <p className="p-4 text-sm text-gray-500">Loading chats...</p>
            ) : threads.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No chats yet. Start one!</p>
            ) : (
              <ul className="divide-y">
                {threads.map((thread) => (
                  <li
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`p-4 cursor-pointer flex items-start gap-3 ${
                      selectedThread?.id === thread.id ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                      <FiMessageSquare />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{thread.business_name}</div>
                      <div className="text-xs text-gray-500">{thread.customer_name}</div>
                      {thread.last_message && (
                        <div className="mt-1 text-xs text-gray-400 truncate">{thread.last_message.body}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border rounded-lg shadow-sm flex flex-col h-[700px]">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
              Select a shop to start chatting.
            </div>
          ) : (
            <>
              <div className="p-4 border-b">
                <h3 className="text-base font-semibold text-gray-800">{selectedThread.business_name}</h3>
                <p className="text-xs text-gray-500">Your account manager: {selectedThread.customer_name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-3">
                {messagesLoading ? (
                  <p className="text-sm text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.sender_role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p>{msg.body}</p>
                      <span className="block mt-1 text-[10px] opacity-70">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendMessage} className="border-t p-4 flex items-center gap-2">
                <input
                  type="text"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={sendMessageMutation.isLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  <FiSend className="inline mr-1" />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Start a chat</h3>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <label className="block text-sm text-gray-600">
                Select shop
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Choose a shop</option>
                  {connectedShops.map((shop) => (
                    <option key={shop.id || shop.business_id} value={shop.business_id || shop.id}>
                      {shop.business_name || shop.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewChat(false)} className="px-4 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createThreadMutation.isLoading || !selectedBusinessId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Start chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerChatPage;

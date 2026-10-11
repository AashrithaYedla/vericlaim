import { useEffect, useRef, useState } from "react";
import api from "../services/api.js";
import { connectSocket } from "../services/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MessageThread({ complaintId }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const bottom = useRef(null);

  const load = async () => {
    const { data } = await api.get(`/complaints/${complaintId}/messages`);
    setMessages(data.messages || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [complaintId]);

  useEffect(() => {
    const socket = connectSocket(token);
    if (!socket) return;
    socket.emit("complaint:join", complaintId);
    const onNew = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("message:new", onNew);
    return () => {
      socket.emit("complaint:leave", complaintId);
      socket.off("message:new", onNew);
      socket.disconnect();
    };
  }, [complaintId, token]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    await api.post(`/complaints/${complaintId}/messages`, { body });
    setBody("");
    await load();
  };

  if (loading) return <p className="text-sm text-slate-500">Loading messages…</p>;

  return (
    <div className="flex h-[420px] flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>
        )}
        {messages.map((m) => {
          const mine =
            String(m.sender?._id || m.sender?.id || "") === String(user?.id || user?._id || "");
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                }`}
              >
                <p className="text-[10px] opacity-80">
                  {m.sender?.name} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          placeholder="Type a message…"
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}

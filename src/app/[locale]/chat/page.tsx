"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface ChatMessage {
  id: string;
  message: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  author_name: string;
  is_liked_by_me: boolean;
  is_mine: boolean;
}

export default function ChatPage() {
  const { loading: authLoading } = useAuthContext();
  const t = useTranslations("chat");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (offset = 0, append = false) => {
    try {
      const res = await fetch(`/api/chat?offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (append) {
        setMessages((prev) => [...prev, ...data.messages]);
      } else {
        setMessages(data.messages);
      }
      setHasMore(data.has_more);
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast("error", t("messageTooLong"));
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      const msg = await res.json();
      setMessages((prev) => [msg, ...prev]);
      setNewMessage("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      toast("error", message);
    } finally {
      setSending(false);
    }
  };

  const handleLike = async (messageId: string) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              is_liked_by_me: !m.is_liked_by_me,
              likes_count: m.is_liked_by_me
                ? Math.max(0, m.likes_count - 1)
                : m.likes_count + 1,
            }
          : m
      )
    );

    try {
      const res = await fetch(`/api/chat/${messageId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_liked_by_me: data.liked, likes_count: data.likes_count }
            : m
        )
      );
    } catch {
      // Revert on error
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                is_liked_by_me: !m.is_liked_by_me,
                likes_count: m.is_liked_by_me
                  ? Math.max(0, m.likes_count - 1)
                  : m.likes_count + 1,
              }
            : m
        )
      );
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/chat/${messageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast("success", "Message deleted");
    } catch {
      toast("error", "Failed to delete message");
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchMessages(messages.length, true);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-sentinel-muted" />
      </div>
    );
  }

  return (
    <div className="bg-sentinel-surface min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{t("title")}</h1>

        {/* New message form */}
        <Card className="bg-sentinel-card border-sentinel-border mb-6 p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("placeholder")}
                maxLength={500}
                rows={2}
                className="w-full bg-sentinel-bg border border-sentinel-border rounded-md px-3 py-2 text-white placeholder:text-sentinel-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sentinel-accent focus:border-transparent"
              />
              <span className="absolute bottom-2 right-2 text-xs text-sentinel-muted">
                {newMessage.length}/500
              </span>
            </div>
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-sentinel-accent text-black hover:bg-amber-400 self-end"
              size="sm"
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Messages list */}
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sentinel-muted">{t("noMessages")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Card
                key={msg.id}
                className="bg-sentinel-card border-sentinel-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-sentinel-accent">
                        {msg.author_name}
                      </span>
                      <span className="text-xs text-sentinel-muted">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-sentinel-text whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleLike(msg.id)}
                      className="flex items-center gap-1 text-xs transition-colors"
                    >
                      <Heart
                        className={`size-4 ${
                          msg.is_liked_by_me
                            ? "fill-red-500 text-red-500"
                            : "text-sentinel-muted hover:text-red-400"
                        }`}
                      />
                      {msg.likes_count > 0 && (
                        <span
                          className={
                            msg.is_liked_by_me
                              ? "text-red-500"
                              : "text-sentinel-muted"
                          }
                        >
                          {msg.likes_count}
                        </span>
                      )}
                    </button>
                    {msg.is_mine && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-sentinel-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="border-sentinel-border text-sentinel-text hover:bg-sentinel-card"
                >
                  {loadingMore ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : null}
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

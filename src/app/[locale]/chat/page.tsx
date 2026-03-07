"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Loader2, Send, MessageCircle, Pencil, X, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface ChatMessage {
  id: string;
  message: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  edited: boolean;
  edited_at: string | null;
  author_name: string;
  is_liked_by_me: boolean;
  is_mine: boolean;
  replies: ChatMessage[];
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
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  const handleReply = async (parentId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast("error", t("messageTooLong"));
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, parent_id: parentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reply");
      }
      const reply = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === parentId
            ? { ...m, replies: [...m.replies, reply] }
            : m
        )
      );
      setReplyTo(null);
      setReplyText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reply";
      toast("error", message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleEdit = async (messageId: string, parentId: string | null) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      toast("error", t("messageTooLong"));
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/chat/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to edit");
      }
      const updated = await res.json();

      if (parentId) {
        // Editing a reply
        setMessages((prev) =>
          prev.map((m) =>
            m.id === parentId
              ? {
                  ...m,
                  replies: m.replies.map((r) =>
                    r.id === messageId
                      ? { ...r, message: updated.message, edited: true, edited_at: updated.edited_at }
                      : r
                  ),
                }
              : m
          )
        );
      } else {
        // Editing a top-level message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, message: updated.message, edited: true, edited_at: updated.edited_at }
              : m
          )
        );
      }
      setEditingId(null);
      setEditText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to edit message";
      toast("error", message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLike = async (messageId: string, parentId: string | null) => {
    const updateLike = (msg: ChatMessage): ChatMessage => {
      if (msg.id === messageId) {
        return {
          ...msg,
          is_liked_by_me: !msg.is_liked_by_me,
          likes_count: msg.is_liked_by_me
            ? Math.max(0, msg.likes_count - 1)
            : msg.likes_count + 1,
        };
      }
      return msg;
    };

    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (parentId && m.id === parentId) {
          return { ...m, replies: m.replies.map(updateLike) };
        }
        return updateLike(m);
      })
    );

    try {
      const res = await fetch(`/api/chat/${messageId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle like");
      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) => {
          if (parentId && m.id === parentId) {
            return {
              ...m,
              replies: m.replies.map((r) =>
                r.id === messageId
                  ? { ...r, is_liked_by_me: data.liked, likes_count: data.likes_count }
                  : r
              ),
            };
          }
          if (m.id === messageId) {
            return { ...m, is_liked_by_me: data.liked, likes_count: data.likes_count };
          }
          return m;
        })
      );
    } catch {
      // Revert on error
      setMessages((prev) =>
        prev.map((m) => {
          if (parentId && m.id === parentId) {
            return { ...m, replies: m.replies.map(updateLike) };
          }
          return updateLike(m);
        })
      );
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

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("daysAgo", { count: diffDays });
    return date.toLocaleDateString();
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const renderMessage = (msg: ChatMessage, isReply = false, parentId: string | null = null) => {
    const isEditing = editingId === msg.id;

    return (
      <div key={msg.id} className={`${isReply ? "ml-12 mt-3" : ""}`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`shrink-0 ${isReply ? "size-7" : "size-9"} rounded-full bg-sentinel-accent/20 flex items-center justify-center`}>
            <span className={`${isReply ? "text-xs" : "text-sm"} font-semibold text-sentinel-accent`}>
              {getInitial(msg.author_name)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Author + time */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`${isReply ? "text-xs" : "text-sm"} font-medium text-sentinel-accent`}>
                {msg.author_name}
              </span>
              <span className="text-xs text-sentinel-muted">
                {formatTime(msg.created_at)}
              </span>
              {msg.edited && (
                <span className="text-xs text-sentinel-muted italic">
                  ({t("edited")})
                </span>
              )}
            </div>

            {/* Reply indicator */}
            {isReply && msg.parent_id && (
              <div className="text-xs text-sentinel-muted mb-0.5">
                {/* The parent author name is on the parent message itself */}
              </div>
            )}

            {/* Message text or edit form */}
            {isEditing ? (
              <div className="mt-1">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full bg-sentinel-bg border border-sentinel-border rounded-md px-3 py-2 text-white placeholder:text-sentinel-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sentinel-accent focus:border-transparent"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(msg.id, parentId)}
                    disabled={savingEdit || !editText.trim()}
                    className="bg-sentinel-accent text-black hover:bg-amber-400 h-7 px-3 text-xs"
                  >
                    {savingEdit ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Check className="size-3" />
                    )}
                    <span className="ml-1">{t("save")}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingId(null); setEditText(""); }}
                    className="text-sentinel-muted hover:text-white h-7 px-3 text-xs"
                  >
                    <X className="size-3" />
                    <span className="ml-1">{t("cancel")}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-sentinel-text whitespace-pre-wrap break-words">
                {msg.message}
              </p>
            )}

            {/* Action buttons */}
            {!isEditing && (
              <div className="flex items-center gap-4 mt-1.5">
                {/* Like */}
                <button
                  onClick={() => handleLike(msg.id, parentId)}
                  className="flex items-center gap-1 text-xs transition-colors group"
                >
                  <Heart
                    className={`size-3.5 ${
                      msg.is_liked_by_me
                        ? "fill-red-500 text-red-500"
                        : "text-sentinel-muted group-hover:text-red-400"
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
                  {!msg.is_liked_by_me && msg.likes_count === 0 && (
                    <span className="text-sentinel-muted group-hover:text-red-400">
                      {t("like")}
                    </span>
                  )}
                </button>

                {/* Reply (only on top-level messages) */}
                {!isReply && (
                  <button
                    onClick={() => {
                      setReplyTo({ id: msg.id, author: msg.author_name });
                      setReplyText("");
                    }}
                    className="flex items-center gap-1 text-xs text-sentinel-muted hover:text-sentinel-accent transition-colors"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>{t("reply")}</span>
                  </button>
                )}

                {/* Edit (own messages only) */}
                {msg.is_mine && (
                  <button
                    onClick={() => {
                      setEditingId(msg.id);
                      setEditText(msg.message);
                    }}
                    className="flex items-center gap-1 text-xs text-sentinel-muted hover:text-sentinel-accent transition-colors"
                  >
                    <Pencil className="size-3.5" />
                    <span>{t("editMessage")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {!isReply && msg.replies && msg.replies.length > 0 && (
          <div className="border-l-2 border-sentinel-border/50 ml-4 pl-0">
            {msg.replies.map((reply) => renderMessage(reply, true, msg.id))}
          </div>
        )}

        {/* Reply input */}
        {!isReply && replyTo?.id === msg.id && (
          <div className="ml-12 mt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-sentinel-muted">
                {t("replyingTo", { name: replyTo.author })}
              </span>
              <button
                onClick={() => { setReplyTo(null); setReplyText(""); }}
                className="text-sentinel-muted hover:text-white"
              >
                <X className="size-3" />
              </button>
            </div>
            <div className="flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t("replyPlaceholder")}
                maxLength={500}
                rows={1}
                className="flex-1 bg-sentinel-bg border border-sentinel-border rounded-md px-3 py-1.5 text-white placeholder:text-sentinel-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sentinel-accent focus:border-transparent"
                autoFocus
              />
              <Button
                onClick={() => handleReply(msg.id)}
                disabled={sendingReply || !replyText.trim()}
                className="bg-sentinel-accent text-black hover:bg-amber-400 h-8 px-3"
                size="sm"
              >
                {sendingReply ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Send className="size-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
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
          <div className="space-y-1">
            {messages.map((msg) => (
              <Card
                key={msg.id}
                className="bg-sentinel-card border-sentinel-border p-4"
              >
                {renderMessage(msg)}
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

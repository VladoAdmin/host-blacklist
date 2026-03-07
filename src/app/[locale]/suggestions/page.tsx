"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  likes_count: number;
  status: string;
  created_at: string;
  user_id: string;
  author_name: string;
  is_liked_by_me: boolean;
  is_mine: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  planned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  done: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function SuggestionsPage() {
  const { loading: authLoading } = useAuthContext();
  const t = useTranslations("suggestions");

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New suggestion form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchSuggestions = useCallback(
    async (offset = 0, append = false, sortOrder?: string) => {
      try {
        const s = sortOrder || sort;
        const res = await fetch(`/api/suggestions?sort=${s}&offset=${offset}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (append) {
          setSuggestions((prev) => [...prev, ...data.suggestions]);
        } else {
          setSuggestions(data.suggestions);
        }
        setHasMore(data.has_more);
      } catch {
        setError("Failed to load suggestions");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort]
  );

  useEffect(() => {
    setLoading(true);
    fetchSuggestions(0, false, sort);
  }, [sort, fetchSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    const description = newDescription.trim();

    if (!title) return;
    if (title.length > 100) {
      toast("error", t("titleTooLong"));
      return;
    }
    if (description && description.length > 1000) {
      toast("error", t("descTooLong"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create suggestion");
      }
      const suggestion = await res.json();
      setSuggestions((prev) => [suggestion, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create suggestion";
      toast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (suggestionId: string) => {
    // Optimistic update
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === suggestionId
          ? {
              ...s,
              is_liked_by_me: !s.is_liked_by_me,
              likes_count: s.is_liked_by_me
                ? Math.max(0, s.likes_count - 1)
                : s.likes_count + 1,
            }
          : s
      )
    );

    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle like");
      const data = await res.json();
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? { ...s, is_liked_by_me: data.liked, likes_count: data.likes_count }
            : s
        )
      );
    } catch {
      // Revert
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestionId
            ? {
                ...s,
                is_liked_by_me: !s.is_liked_by_me,
                likes_count: s.is_liked_by_me
                  ? Math.max(0, s.likes_count - 1)
                  : s.likes_count + 1,
              }
            : s
        )
      );
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/suggestions/${suggestionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      toast("success", "Suggestion deleted");
    } catch {
      toast("error", "Failed to delete suggestion");
    }
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchSuggestions(suggestions.length, true);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const statusKey = (status: string) => {
    const map: Record<string, string> = {
      open: "statusOpen",
      planned: "statusPlanned",
      done: "statusDone",
      rejected: "statusRejected",
    };
    return map[status] || "statusOpen";
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-sentinel-accent text-black hover:bg-amber-400 font-semibold"
            size="sm"
          >
            {showForm ? <X className="size-4 mr-1" /> : <Plus className="size-4 mr-1" />}
            {showForm ? t("cancel") : t("newSuggestion")}
          </Button>
        </div>

        {/* New suggestion form */}
        {showForm && (
          <Card className="bg-sentinel-card border-sentinel-border mb-6 p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sentinel-text">{t("titleLabel")}</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={100}
                  placeholder={t("titleLabel")}
                  required
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
                <span className="text-xs text-sentinel-muted">{newTitle.length}/100</span>
              </div>
              <div className="space-y-2">
                <Label className="text-sentinel-text">{t("descriptionLabel")}</Label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder={t("descriptionLabel")}
                  className="w-full bg-sentinel-bg border border-sentinel-border rounded-md px-3 py-2 text-white placeholder:text-sentinel-muted text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sentinel-accent focus:border-transparent"
                />
                <span className="text-xs text-sentinel-muted">{newDescription.length}/1000</span>
              </div>
              <Button
                type="submit"
                disabled={submitting || !newTitle.trim()}
                className="bg-sentinel-accent text-black hover:bg-amber-400 font-semibold"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : null}
                {t("submit")}
              </Button>
            </form>
          </Card>
        )}

        {/* Sort tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSort("newest")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sort === "newest"
                ? "bg-sentinel-card text-white"
                : "text-sentinel-muted hover:bg-sentinel-card/50 hover:text-white"
            }`}
          >
            {t("sortNewest")}
          </button>
          <button
            onClick={() => setSort("popular")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sort === "popular"
                ? "bg-sentinel-card text-white"
                : "text-sentinel-muted hover:bg-sentinel-card/50 hover:text-white"
            }`}
          >
            {t("sortPopular")}
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Suggestions list */}
        {suggestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sentinel-muted">{t("noSuggestions")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <Card
                key={s.id}
                className="bg-sentinel-card border-sentinel-border p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Like button (left side) */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => handleLike(s.id)}
                      className="flex flex-col items-center transition-colors"
                    >
                      <Heart
                        className={`size-5 ${
                          s.is_liked_by_me
                            ? "fill-red-500 text-red-500"
                            : "text-sentinel-muted hover:text-red-400"
                        }`}
                      />
                      <span
                        className={`text-xs mt-0.5 ${
                          s.is_liked_by_me
                            ? "text-red-500"
                            : "text-sentinel-muted"
                        }`}
                      >
                        {s.likes_count}
                      </span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-white">
                        {s.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[s.status] || STATUS_COLORS.open}
                      >
                        {t(statusKey(s.status))}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="text-sm text-sentinel-muted mb-2 line-clamp-3">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-sentinel-muted">
                      <span className="text-sentinel-accent">{s.author_name}</span>
                      <span>{formatTime(s.created_at)}</span>
                      {s.is_mine && (
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-sentinel-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
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

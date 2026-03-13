"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail, Phone, User, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";

export interface DuplicateGuest {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  reports_count: number;
  match_type: "email" | "phone" | "name";
  name_similarity: number;
}

interface DuplicateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateGuest[];
  onProceed: () => void;
  loading: boolean;
}

function MatchBadge({ type }: { type: string }) {
  const t = useTranslations("duplicates");

  const config = {
    email: {
      label: t("matchEmail"),
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    phone: {
      label: t("matchPhone"),
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    name: {
      label: t("matchName"),
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
  }[type] || {
    label: type,
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

export default function DuplicateModal({
  open,
  onOpenChange,
  duplicates,
  onProceed,
  loading,
}: DuplicateModalProps) {
  const t = useTranslations("duplicates");
  const tCommon = useTranslations("common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-sentinel-card border-sentinel-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white tracking-tight">
            <AlertTriangle className="size-5 text-amber-400" />
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-sentinel-muted">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[300px] overflow-y-auto space-y-3 py-2">
          {duplicates.map((guest) => (
            <Link
              key={guest.id}
              href={`/guest/${guest.id}` as "/dashboard"}
              className="block"
              onClick={() => onOpenChange(false)}
            >
              <div className="flex items-start gap-3 p-3 rounded-xl border border-sentinel-border/50 bg-sentinel-surface hover:border-sentinel-accent/30 transition-all duration-200 cursor-pointer">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sentinel-accent/10">
                  <User className="size-4 text-sentinel-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm truncate">
                      {guest.full_name}
                    </span>
                    <MatchBadge type={guest.match_type} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {guest.email && (
                      <div className="flex items-center gap-1.5 text-xs text-sentinel-muted">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-sentinel-muted">
                        <Phone className="size-3 shrink-0" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <FileText className="size-3 text-sentinel-muted" />
                    <span className="text-xs text-sentinel-muted">
                      {guest.reports_count}{" "}
                      {guest.reports_count === 1
                        ? t("reportSingle")
                        : t("reportMultiple")}
                    </span>
                    {guest.match_type === "name" && (
                      <span className="text-xs text-sentinel-muted ml-2">
                        {t("similarity", {
                          score: Math.round(guest.name_similarity * 100),
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-sentinel-border/50 text-sentinel-text hover:bg-sentinel-card hover:border-sentinel-accent/30 transition-all duration-200 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={onProceed}
            disabled={loading}
            className="bg-sentinel-accent text-black hover:bg-amber-400 font-semibold rounded-xl"
          >
            {loading ? t("submitting") : t("proceedAnyway")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

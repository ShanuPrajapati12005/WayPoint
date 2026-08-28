import * as React from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  Target,
  Star,
  AlertTriangle,
  Building2,
  Heart,
  Edit2,
  Trash2,
  Plus,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** First letters of the user's name — "Prashant Kumar" → "PK". */
function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "U"
  );
}

export default function MyProfile() {
  const { userProfile, isLoading, showToast } = useApp();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl h-96 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  const dc = userProfile.detailedContext || {};
  
  const profileItems = [
    { icon: GraduationCap, label: "Education", value: dc.education, tone: "text-primary" },
    { icon: Briefcase, label: "Experience", value: userProfile.pastExperience, tone: "text-blue-500" },
    { icon: Target, label: "Career Goal", value: userProfile.careerGoals, tone: "text-violet-500" },
    { icon: Star, label: "Strengths", value: dc.strengths, tone: "text-amber-500" },
    { icon: AlertTriangle, label: "Areas to Improve", value: dc.weaknesses, tone: "text-orange-500" },
    { icon: Building2, label: "Dream Company", value: dc.dreamCompany, tone: "text-emerald-500" },
    { icon: Heart, label: "Motivation", value: dc.motivation, tone: "text-rose-500" },
  ].filter((item) => item.value && item.value !== "Not specified" && item.value !== "Failed to extract");

  const handleAction = (action, itemLabel) => {
    showToast(`Cannot ${action} ${itemLabel || "item"}`, {
      description: "Database modification is disabled in this environment.",
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 max-w-3xl mx-auto">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your information and career goals</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Identity Header Card */}
        <Card className="border-border shadow-sm bg-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 to-[#8b5cf6]/20" />
          <CardContent className="relative pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 sm:-mt-10 mb-4 px-2">
              <div className="flex size-24 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-primary to-[#8b5cf6] font-mono text-3xl font-bold text-primary-foreground shadow-sm">
                {initials(userProfile.name)}
              </div>
              <div className="text-center sm:text-left mb-2 flex-1">
                <h2 className="text-2xl font-bold text-foreground">{userProfile.name}</h2>
                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
              </div>
              <div className="mb-2">
                <Button variant="outline" size="sm" onClick={() => handleAction("edit", "Profile Picture")}>
                  <Edit2 className="mr-2 size-3.5" />
                  Edit Profile
                </Button>
              </div>
            </div>
            
            {userProfile.learningStyle && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 px-2">
                <Badge variant="secondary" className="text-xs capitalize px-2.5 py-1 rounded-full border-border">
                  📚 {userProfile.learningStyle?.replace("-", " ")}
                </Badge>
                {userProfile.weeklyTimeHours && (
                  <Badge variant="secondary" className="text-xs px-2.5 py-1 rounded-full border-border">
                    ⏰ {userProfile.weeklyTimeHours} hrs/week
                  </Badge>
                )}
                {dc.preferredLanguages && dc.preferredLanguages.map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs px-2.5 py-1 rounded-full">
                    {lang}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Profile Sections */}
        <Card className="border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="size-4" />
              </span>
              <CardTitle className="text-lg">Profile Details</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleAction("add", "new section")}>
              <Plus className="mr-2 size-4" />
              Add Detail
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {profileItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Your profile is currently empty.</p>
                <Button variant="outline" className="mt-4" onClick={() => handleAction("add", "details")}>
                  Start building profile
                </Button>
              </div>
            ) : (
              profileItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={cn(
                    "flex flex-col sm:flex-row sm:items-start justify-between gap-4 group rounded-lg p-3 transition-colors hover:bg-accent/50",
                    idx !== profileItems.length - 1 && "border-b border-border/30 pb-6"
                  )}>
                    <div className="flex items-start gap-3 flex-1">
                      <span className={cn("mt-1 shrink-0 p-2 rounded-md bg-background border border-border shadow-sm", item.tone)}>
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          {item.label}
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">{item.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 self-end sm:self-start">
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={() => handleAction("edit", item.label)}>
                        <Edit2 className="size-4" />
                        <span className="sr-only">Edit {item.label}</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => handleAction("delete", item.label)}>
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete {item.label}</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { AppShell, Button, Card, Label, inputClass } from "@/components/app-shell";

export default function SettingsPage() {
  const [userName, setUserName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUserName(localStorage.getItem("hi_user_name") ?? "");
  }, []);

  const handleSave = useCallback(() => {
    const name = userName.trim();
    if (name) {
      localStorage.setItem("hi_user_name", name);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }, [userName]);

  const handleClearAll = useCallback(() => {
    if (!window.confirm("This will delete ALL candidates, roles, and activity history. Are you sure?")) return;
    ["hi_candidates", "hi_jobreqs", "hi_activity"].forEach((k) => localStorage.removeItem(k));
    window.location.href = "/";
  }, []);

  return (
    <AppShell activeNavId="settings" title="Settings" subtitle="Preferences and data management">
      <div className="max-w-xl space-y-6">
        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Profile</h2>
          <p className="mt-0.5 text-sm text-slate-500">Your name shown in the sidebar and activity feed.</p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="user-name">Your name</Label>
              <input
                id="user-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="e.g. Rahmat Suradi"
                className={inputClass}
              />
            </div>
            <Button variant="primary" size="md" onClick={handleSave}>
              {saved ? "Saved ✓" : "Save name"}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h2>
          <p className="mt-0.5 text-sm text-slate-500">Use the moon/sun icon in the top bar to cycle between Light, Dark, and System theme.</p>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
          <p className="mt-1 text-sm text-slate-500">Permanently deletes all data stored locally in this browser.</p>
          <Button variant="danger" size="md" className="mt-4" onClick={handleClearAll}>
            Clear all data
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

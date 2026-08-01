"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Languages, Moon, Shield, Sun, User, Wallet } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/use-settings-store";
import { useCurrency } from "@/hooks/use-currency";
import { useTranslation } from "@/hooks/use-translation";
import { SUPPORTED_CURRENCIES, CURRENCY_METADATA } from "@/lib/currency/constants";
import { LANGUAGE_METADATA, LocaleCode } from "@/lib/i18n";
import { useMounted } from "@/hooks/use-mounted";

// PERBAIKAN: Membuat tipe CurrencyCode secara dinamis dari array konstanta yang ada
type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

const STORAGE_KEYS = [
  "finance-storage",
  "planning-storage",
  "diary-storage",
  "settings-storage",
  "currency-storage",
  "language-storage",
];

export default function SettingsPage() {
  const { user } = useUser();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useTranslation();

  const {
    displayName,
    emailNotifications,
    pushNotifications,
    setDisplayName,
    setEmailNotifications,
    setPushNotifications,
    resetSettings,
  } = useSettingsStore();

  const displayNameValue = mounted ? displayName || user?.fullName || "" : "";
  const emailValue = mounted ? user?.primaryEmailAddress?.emailAddress ?? "" : "";
  const currencyValue = mounted ? currency : "IDR";
  const languageValue = mounted ? language : "en";
  const emailNotificationsValue = mounted ? emailNotifications : true;
  const pushNotificationsValue = mounted ? pushNotifications : false;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">{t("common.settings")}</h1>
        <p className="text-muted-foreground">{t("settings.profileDescription")}</p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">{t("settings.profile")}</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.accountIdentity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display-name">{t("settings.displayName")}</Label>
                <Input
                  id="display-name"
                  value={displayNameValue}
                  disabled={!mounted}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("settings.email")}</Label>
                <Input value={emailValue} disabled />
              </div>
            </div>
            <Button
              disabled={!mounted}
              onClick={() => {
                toast.success("Profile preferences saved.");
              }}
            >
              {t("common.save")} {t("settings.profile").toLowerCase()}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-violet-600" />
          <h2 className="text-xl font-semibold">{t("settings.appearance")}</h2>
        </div>
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("common.theme")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.themeDescription")}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={mounted && resolvedTheme === "light" ? "secondary" : "outline"}
                  disabled={!mounted}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-1 h-4 w-4" /> {t("common.light")}
                </Button>
                <Button
                  variant={mounted && resolvedTheme === "dark" ? "secondary" : "outline"}
                  disabled={!mounted}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-1 h-4 w-4" /> {t("common.dark")}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t("settings.currency")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.currencyDescription")}</p>
              </div>
              <Select
                value={currencyValue}
                disabled={!mounted}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  setCurrency(value as CurrencyCode);
                  toast.success(`Currency changed to ${value}`);
                }}
              >
                <SelectTrigger className="w-40">
                  <Wallet className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {CURRENCY_METADATA[code].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-sm text-muted-foreground">Preferred language for the user interface.</p>
              </div>
              <Select
                value={languageValue}
                disabled={!mounted}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  setLanguage(value as LocaleCode);
                  toast.success(`Language changed to ${LANGUAGE_METADATA[value as LocaleCode].label}`);
                }}
              >
                <SelectTrigger className="w-48">
                  <Languages className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_METADATA).map(([code, meta]) => (
                    <SelectItem key={code} value={code}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold">{t("common.notifications")}</h2>
        </div>
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("settings.emailSummaries")}</p>
                <p className="text-sm text-muted-foreground">{t("settings.notificationsDescription")}</p>
              </div>
              <Switch
                checked={emailNotificationsValue}
                disabled={!mounted}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("settings.inAppAlerts")}</p>
                <p className="text-sm text-muted-foreground">{t("dashboard.budgetTracker")}</p>
              </div>
              <Switch
                checked={pushNotificationsValue}
                disabled={!mounted}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-rose-600" />
          <h2 className="text-xl font-semibold">{t("settings.dataSecurity")}</h2>
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">{t("settings.dataDescription")}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!mounted}
                onClick={() => {
                  const payload = {
                    settings: {
                      displayName,
                      emailNotifications,
                      pushNotifications,
                    },
                  };

                  const blob = new Blob([JSON.stringify(payload, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "finansia-settings.json";
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
              >
                {t("settings.exportSettings")}
              </Button>
              <Button
                variant="destructive"
                disabled={!mounted}
                onClick={() => {
                  const confirmed = window.confirm(t("settings.resetConfirm"));

                  if (!confirmed) {
                    return;
                  }

                  for (const key of STORAGE_KEYS) {
                    window.localStorage.removeItem(key);
                  }

                  resetSettings();
                  toast.success("Local data cleared. Reloading...");
                  window.location.reload();
                }}
              >
                {t("settings.resetLocalData")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
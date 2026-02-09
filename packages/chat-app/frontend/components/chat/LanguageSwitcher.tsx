/**
 * LanguageSwitcher Component
 * Allows switching between English and Traditional Chinese
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Languages } from "lucide-react";
import { useI18n, type Language } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { id: Language; label: string; shortLabel: string; flag: string }[] = [
    { id: "en", label: "English", shortLabel: "EN", flag: "🇺🇸" },
    { id: "zh-TW", label: "繁體中文", shortLabel: "繁中", flag: "🇹🇼" },
  ];

  const currentLang = languages.find((l) => l.id === lang);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs"
        title={t("language")}
      >
        <Languages className="w-4 h-4" />
        <span>{currentLang?.shortLabel}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => {
                setLang(language.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                lang === language.id ? "bg-muted font-medium" : ""
              }`}
            >
              <span>{language.flag}</span>
              <span>{language.label}</span>
              {lang === language.id && (
                <span className="ml-auto text-emerald-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

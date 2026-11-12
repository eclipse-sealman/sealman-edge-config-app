import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import { CheckIcon } from "@heroicons/react/24/solid";
import PageTitle from "@/components/Typography/PageTitle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import defaultLogo from "@/assets/sealman_logo.png";
import useAppearanceStore, { DEFAULT_APP_TITLE, DEFAULT_FAVICON } from "@/features/Appearance/appearanceStore";
import {
  CUSTOM_THEME_ID,
  DEFAULT_THEME_ID,
  THEME_PRESETS,
  getThemePreset,
  hexToHsl,
  hslToHex,
  readCssVariable,
  themeToCss,
  writeCssVariable,
  type ThemeVariables,
} from "@/features/Appearance/themes";

const COLOR_GROUPS: { title: string; colors: { name: string; label: string }[] }[] = [
  {
    title: "Navigation",
    colors: [
      { name: "--nav", label: "Sidebar background" },
      { name: "--nav-foreground", label: "Sidebar text" },
      { name: "--nav-active", label: "Sidebar active item" },
      { name: "--nav-active-foreground", label: "Sidebar active text" },
    ],
  },
  {
    title: "Header",
    colors: [
      { name: "--header-from", label: "Gradient left" },
      { name: "--header-via", label: "Gradient middle" },
      { name: "--header-to", label: "Gradient right" },
      { name: "--header-border", label: "Bottom border" },
    ],
  },
  {
    title: "Content",
    colors: [
      { name: "--primary", label: "Primary (buttons, links)" },
      { name: "--primary-foreground", label: "Text on primary" },
      { name: "--page", label: "Page background" },
      { name: "--background", label: "Card / panel background" },
      { name: "--foreground", label: "Text" },
      { name: "--muted-foreground", label: "Secondary text" },
      { name: "--accent", label: "Hover highlight" },
      { name: "--border", label: "Borders" },
      { name: "--destructive", label: "Danger / delete" },
    ],
  },
];

const LOGO_MAX_BYTES = 512 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
const FAVICON_MAX_BYTES = 128 * 1024;
const FAVICON_TYPES = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"];

function readImageFile(
  file: File,
  types: string[],
  maxBytes: number,
  typesLabel: string,
  onLoad: (dataUrl: string) => void,
) {
  // Some systems report .ico files without a MIME type.
  const type = file.type || (file.name.toLowerCase().endsWith(".ico") ? "image/x-icon" : "");
  if (!types.includes(type)) {
    toast.error(`Unsupported file type. Use ${typesLabel}.`);
    return;
  }
  if (file.size > maxBytes) {
    toast.error(`The file must not be larger than ${maxBytes / 1024} KB.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad((reader.result as string).replace(/^data:[^;,]*/, `data:${type}`));
  reader.onerror = () => toast.error("Could not read the file.");
  reader.readAsDataURL(file);
}

function Swatches({ variables }: { variables: ThemeVariables }) {
  return (
    <div className="flex gap-1">
      {["--nav", "--primary", "--accent", "--page"].map((name) => (
        <span
          key={name}
          className="h-5 w-5 rounded-full border"
          style={{ backgroundColor: `hsl(${variables[name]})` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function ThemeOption({
  name,
  description,
  selected,
  onSelect,
  variables,
}: {
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  variables?: ThemeVariables;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex flex-col gap-3 rounded-lg border bg-card p-4 text-left shadow-xs transition-colors hover:bg-accent ${
        selected ? "border-primary ring-1 ring-primary" : ""
      }`}
    >
      {selected && <CheckIcon className="absolute right-3 top-3 h-4 w-4 text-primary" aria-hidden="true" />}
      {variables ? <Swatches variables={variables} /> : <span className="h-5 font-mono text-xs text-muted-foreground">{"{ css }"}</span>}
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export default function AppearanceSettings() {
  const {
    themeId,
    customCss,
    logoDataUrl,
    appTitle,
    faviconDataUrl,
    setThemeId,
    setCustomCss,
    setLogoDataUrl,
    setAppTitle,
    setFaviconDataUrl,
  } = useAppearanceStore();
  const [cssDraft, setCssDraft] = useState(customCss);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const selectCustom = () => {
    if (!customCss) {
      // Start from the theme that is currently active so the user only tweaks what they need.
      const template = themeToCss(getThemePreset(themeId).variables);
      setCustomCss(template);
      setCssDraft(template);
    }
    setThemeId(CUSTOM_THEME_ID);
  };

  const isCustom = themeId === CUSTOM_THEME_ID;
  // Preset selected: the pickers show its colors, and the first change forks it into a custom theme.
  const activeCss = isCustom ? customCss : themeToCss(getThemePreset(themeId).variables);

  const setColor = (name: string, hex: string) => {
    const value = hexToHsl(hex, readCssVariable(activeCss, name) ?? "");
    const next = writeCssVariable(activeCss, name, value);
    setCustomCss(next);
    setCssDraft(next);
    if (!isCustom) setThemeId(CUSTOM_THEME_ID);
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) readImageFile(file, LOGO_TYPES, LOGO_MAX_BYTES, "PNG, JPEG, SVG or WebP", setLogoDataUrl);
  };

  const handleFaviconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) readImageFile(file, FAVICON_TYPES, FAVICON_MAX_BYTES, "ICO, PNG or SVG", setFaviconDataUrl);
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Appearance" description="Customize the colors, the header logo and the browser tab of the platform." />

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Theme</h3>
          <p className="text-sm text-muted-foreground">Pick a preset, then fine-tune individual colors below.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {THEME_PRESETS.map((preset) => (
            <ThemeOption
              key={preset.id}
              name={preset.name}
              description={preset.description}
              variables={preset.variables}
              selected={themeId === preset.id}
              onSelect={() => setThemeId(preset.id)}
            />
          ))}
          <ThemeOption
            name="Custom"
            description="Your own CSS variables."
            selected={themeId === CUSTOM_THEME_ID}
            onSelect={selectCustom}
          />
        </div>

        <div className="space-y-6 rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Click a color swatch to change it. Changes apply immediately
            {isCustom ? "." : " and turn the selected preset into your custom theme."}
          </p>
          {COLOR_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-sm font-semibold">{group.title}</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {group.colors.map(({ name, label }) => {
                  const hex = hslToHex(readCssVariable(activeCss, name) ?? "");
                  return (
                    <label
                      key={name}
                      className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 hover:bg-accent"
                    >
                      <input
                        type="color"
                        value={hex ?? "#000000"}
                        disabled={!hex}
                        onChange={(e) => setColor(name, e.target.value)}
                        className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {isCustom && (
            <details>
              <summary className="cursor-pointer text-sm font-semibold">Advanced: edit CSS</summary>
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Colors are HSL values (<code>hue saturation% lightness%</code>). The CSS is applied on top of the
                  default theme.
                </p>
                <Textarea
                  aria-label="Custom theme CSS"
                  value={cssDraft}
                  onChange={(e) => setCssDraft(e.target.value)}
                  spellCheck={false}
                  rows={18}
                  className="font-mono text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={cssDraft === customCss}
                    onClick={() => {
                      setCustomCss(cssDraft);
                      toast.success("Custom theme applied");
                    }}
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={cssDraft === customCss}
                    onClick={() => setCssDraft(customCss)}
                  >
                    Discard changes
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCssDraft(themeToCss(getThemePreset(DEFAULT_THEME_ID).variables))}
                  >
                    Load default template
                  </Button>
                </div>
              </div>
            </details>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Logo</h3>
          <p className="text-sm text-muted-foreground">Shown in the top left corner. PNG, JPEG, SVG or WebP, max. 512 KB.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-4">
          <div className="flex h-14 w-60 items-center justify-center rounded-md border bg-linear-to-r from-header-from via-header-via to-header-to px-3">
            <img className="h-10 w-auto max-w-full object-contain" src={logoDataUrl ?? defaultLogo} alt="Current logo" />
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={LOGO_TYPES.join(",")}
              className="hidden"
              onChange={handleLogoChange}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              Upload logo
            </Button>
            <Button type="button" variant="ghost" disabled={!logoDataUrl} onClick={() => setLogoDataUrl(null)}>
              Restore default
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Browser Tab</h3>
          <p className="text-sm text-muted-foreground">Title and icon shown in the browser tab.</p>
        </div>
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="appTitle" className="w-24">
              Title
            </Label>
            <Input
              id="appTitle"
              value={appTitle}
              maxLength={80}
              placeholder={DEFAULT_APP_TITLE}
              onChange={(e) => setAppTitle(e.target.value)}
              className="w-80"
            />
            <Button type="button" variant="ghost" disabled={!appTitle} onClick={() => setAppTitle("")}>
              Restore default
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-sm font-medium">Icon</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
              <img className="h-6 w-6 object-contain" src={faviconDataUrl ?? DEFAULT_FAVICON} alt="Current tab icon" />
            </span>
            <input
              ref={faviconInputRef}
              type="file"
              accept={[...FAVICON_TYPES, ".ico"].join(",")}
              className="hidden"
              onChange={handleFaviconChange}
            />
            <Button type="button" variant="outline" onClick={() => faviconInputRef.current?.click()}>
              Upload icon
            </Button>
            <Button type="button" variant="ghost" disabled={!faviconDataUrl} onClick={() => setFaviconDataUrl(null)}>
              Restore default
            </Button>
            <span className="text-xs text-muted-foreground">ICO, PNG or SVG, max. 128 KB. Square images work best.</span>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">Appearance settings are stored in this browser only.</p>
    </div>
  );
}

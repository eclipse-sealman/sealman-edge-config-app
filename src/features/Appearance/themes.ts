export type ThemeVariables = Record<string, string>;

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  variables: ThemeVariables;
}

// Must mirror the :root values in src/index.css - the default theme injects nothing.
const DEFAULT_VARIABLES: ThemeVariables = {
  "--background": "0 0% 100%",
  "--foreground": "222 47% 11%",
  "--card": "0 0% 100%",
  "--card-foreground": "222 47% 11%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "222 47% 11%",
  "--primary": "240 97% 37%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "214 32% 95%",
  "--secondary-foreground": "225 100% 13%",
  "--muted": "210 40% 96%",
  "--muted-foreground": "215 16% 47%",
  "--accent": "214 100% 97%",
  "--accent-foreground": "225 100% 13%",
  "--destructive": "0 72% 51%",
  "--destructive-foreground": "0 0% 98%",
  "--border": "214 32% 91%",
  "--input": "214 32% 86%",
  "--ring": "240 97% 37%",
  "--radius": "0.5rem",
  "--nav": "223 65% 17%",
  "--nav-foreground": "213 27% 84%",
  "--nav-active": "221 83% 53%",
  "--nav-active-foreground": "0 0% 100%",
  "--header-from": "0 0% 100%",
  "--header-via": "214 100% 97% / 0.6",
  "--header-to": "214 95% 93% / 0.7",
  "--header-border": "214 95% 93%",
  "--page": "210 20% 98%",
};

export const DEFAULT_THEME_ID = "default";
export const CUSTOM_THEME_ID = "custom";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: DEFAULT_THEME_ID,
    name: "Sealman",
    description: "The default Sealman blue.",
    variables: DEFAULT_VARIABLES,
  },
  {
    id: "slate",
    name: "Slate",
    description: "Neutral graphite tones.",
    variables: {
      ...DEFAULT_VARIABLES,
      "--primary": "222 47% 20%",
      "--ring": "222 47% 20%",
      "--secondary": "210 20% 95%",
      "--secondary-foreground": "222 47% 11%",
      "--accent": "210 20% 96%",
      "--accent-foreground": "222 47% 11%",
      "--border": "214 20% 90%",
      "--input": "214 20% 84%",
      "--nav": "222 47% 11%",
      "--nav-foreground": "215 20% 75%",
      "--nav-active": "215 25% 27%",
      "--header-via": "210 20% 98%",
      "--header-to": "210 20% 94%",
      "--header-border": "214 20% 90%",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Calm greens.",
    variables: {
      ...DEFAULT_VARIABLES,
      "--primary": "152 76% 28%",
      "--ring": "152 76% 28%",
      "--secondary": "140 30% 95%",
      "--secondary-foreground": "155 60% 12%",
      "--accent": "140 50% 96%",
      "--accent-foreground": "155 60% 12%",
      "--border": "140 20% 89%",
      "--input": "140 20% 84%",
      "--nav": "160 60% 12%",
      "--nav-foreground": "150 20% 80%",
      "--nav-active": "152 76% 32%",
      "--header-via": "140 60% 97% / 0.6",
      "--header-to": "140 50% 92% / 0.7",
      "--header-border": "140 40% 90%",
      "--page": "140 20% 98%",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm orange accents.",
    variables: {
      ...DEFAULT_VARIABLES,
      "--primary": "24 90% 45%",
      "--ring": "24 90% 45%",
      "--secondary": "30 40% 95%",
      "--secondary-foreground": "20 60% 15%",
      "--accent": "33 100% 96%",
      "--accent-foreground": "20 60% 15%",
      "--border": "30 25% 89%",
      "--input": "30 25% 84%",
      "--nav": "15 45% 15%",
      "--nav-foreground": "30 30% 82%",
      "--nav-active": "24 90% 45%",
      "--header-via": "33 100% 97% / 0.6",
      "--header-to": "30 90% 92% / 0.7",
      "--header-border": "30 70% 90%",
      "--page": "30 30% 98%",
    },
  },
];

export function getThemePreset(id: string): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

export function themeToCss(variables: ThemeVariables): string {
  const lines = Object.entries(variables).map(([name, value]) => `  ${name}: ${value};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

const HSL_PATTERN = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*(\/\s*[\d.]+%?)?\s*$/;

/** "h s% l%" (optionally "/ alpha") -> "#rrggbb"; null if the value is no HSL triple. */
export function hslToHex(value: string): string | null {
  const match = HSL_PATTERN.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** "#rrggbb" -> "h s% l%", keeping the alpha suffix of `previous` if it had one. */
export function hexToHsl(hex: string, previous = ""): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = Math.round(h * 60 + 360) % 360;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const alpha = HSL_PATTERN.exec(previous)?.[4];
  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%${alpha ? ` ${alpha}` : ""}`;
}

export function readCssVariable(css: string, name: string): string | null {
  return new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(css)?.[1].trim() ?? null;
}

export function writeCssVariable(css: string, name: string, value: string): string {
  const pattern = new RegExp(`(${name}\\s*:\\s*)[^;]+;`);
  if (pattern.test(css)) return css.replace(pattern, `$1${value};`);
  const rootStart = css.indexOf(":root");
  const rootEnd = rootStart === -1 ? -1 : css.indexOf("}", rootStart);
  if (rootEnd === -1) return `${css}\n:root {\n  ${name}: ${value};\n}\n`;
  return `${css.slice(0, rootEnd)}  ${name}: ${value};\n${css.slice(rootEnd)}`;
}

/** CSS to inject for the given selection; empty for the default theme (index.css already applies it). */
export function resolveThemeCss(themeId: string, customCss: string): string {
  if (themeId === CUSTOM_THEME_ID) return customCss;
  const preset = getThemePreset(themeId);
  return preset.id === DEFAULT_THEME_ID ? "" : themeToCss(preset.variables);
}

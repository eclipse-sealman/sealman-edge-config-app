import { useEffect } from "react";
import useAppearanceStore, { DEFAULT_APP_TITLE, DEFAULT_FAVICON } from "./appearanceStore";
import { resolveThemeCss } from "./themes";

const STYLE_ELEMENT_ID = "sealman-theme";

/** Injects the selected theme as an unlayered stylesheet, which overrides the layered defaults in index.css. */
export default function AppearanceStyles() {
  const themeId = useAppearanceStore((s) => s.themeId);
  const customCss = useAppearanceStore((s) => s.customCss);
  const appTitle = useAppearanceStore((s) => s.appTitle);
  const faviconDataUrl = useAppearanceStore((s) => s.faviconDataUrl);
  const css = resolveThemeCss(themeId, customCss);

  useEffect(() => {
    document.title = appTitle.trim() || DEFAULT_APP_TITLE;
  }, [appTitle]);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconDataUrl ?? DEFAULT_FAVICON;
  }, [faviconDataUrl]);

  useEffect(() => {
    let element = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!css) {
      element?.remove();
      return;
    }
    if (!element) {
      element = document.createElement("style");
      element.id = STYLE_ELEMENT_ID;
      document.head.appendChild(element);
    }
    element.textContent = css;
  }, [css]);

  return null;
}

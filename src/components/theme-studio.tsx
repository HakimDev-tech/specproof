"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "midnight" | "forest" | "warm";
const themes: { id: Theme; label: string; description: string; accent: string }[] = [
  { id: "light", label: "Paper", description: "Clair · neutre", accent: "#4657D8" },
  { id: "dark", label: "Graphite", description: "Sombre · équilibré", accent: "#8B9BFF" },
  { id: "midnight", label: "Midnight", description: "Obscur · contrasté", accent: "#A78BFA" },
  { id: "forest", label: "Forest", description: "Ardoise · émeraude", accent: "#36B98A" },
  { id: "warm", label: "Warm", description: "Ivoire · ambre", accent: "#B77935" },
];

export default function ThemeStudio() {
  const [theme, setTheme] = useState<Theme>("light");
  const [accent, setAccent] = useState("#4657D8");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("specproof-theme") as Theme | null;
      const savedAccent = window.localStorage.getItem("specproof-accent");
      if (savedTheme && themes.some((item) => item.id === savedTheme)) setTheme(savedTheme);
      if (savedAccent && /^#[0-9a-f]{6}$/i.test(savedAccent)) setAccent(savedAccent);
    } catch { /* Appearance remains usable when browser storage is disabled. */ }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--accent-custom", accent);
    document.documentElement.style.setProperty("--blue", accent);
    document.documentElement.style.setProperty("--blue-soft", accent + "18");
    try {
      window.localStorage.setItem("specproof-theme", theme);
      window.localStorage.setItem("specproof-accent", accent);
    } catch { /* Keep the in-memory appearance controls functional. */ }
  }, [theme, accent]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="theme-studio">
      <button className="theme-trigger" type="button" aria-label="Personnaliser le thème" aria-expanded={open} aria-controls="theme-popover" onClick={() => setOpen((value) => !value)}>
        <span className="theme-trigger-orb" style={{ background: `conic-gradient(${accent}, #D65B9B, #E4B34D, #36B98A, ${accent})` }} />
        <span className="theme-trigger-label">Appearance</span>
        <span className="theme-trigger-chevron">{open ? "−" : "+"}</span>
      </button>
      {open && <section id="theme-popover" className="theme-popover" aria-label="Personnalisation de l'apparence">
        <div className="theme-popover-heading"><div><small>DISPLAY SETTINGS</small><strong>Make it yours</strong></div><button type="button" aria-label="Fermer" onClick={() => setOpen(false)}>×</button></div>
        <div className="theme-options">
          {themes.map((item) => <button type="button" key={item.id} className={"theme-option " + (theme === item.id ? "is-active" : "")} aria-pressed={theme === item.id} onClick={() => { setTheme(item.id); if (!window.localStorage.getItem("specproof-accent")) setAccent(item.accent); }}>
            <span className={"theme-swatch swatch-" + item.id}><i /></span><span><b>{item.label}</b><small>{item.description}</small></span><span className="theme-option-check">{theme === item.id ? "✓" : ""}</span>
          </button>)}
        </div>
        <div className="accent-control"><div><b>Accent color</b><small>Personnalisation RGB · HEX</small></div><label className="color-wheel" style={{ background: `conic-gradient(#F44, #FF0, #4F4, #0FF, #44F, #F4F, #F44)` }}><input aria-label="Choisir une couleur personnalisée" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /></label></div>
        <div className="accent-presets">{["#4657D8", "#8B5CF6", "#0D9488", "#D97736", "#DB4777", "#64748B"].map((color) => <button type="button" key={color} aria-label={`Accent ${color}`} className={accent.toLowerCase() === color.toLowerCase() ? "selected" : ""} style={{ background: color }} onClick={() => setAccent(color)} />)}</div>
        <button className="theme-reset" type="button" onClick={() => { setTheme("light"); setAccent("#4657D8"); }}>Reset appearance</button>
      </section>}
    </div>
  );
}

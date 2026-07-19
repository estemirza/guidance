# Guidance — personal Qur'an reader

A private, offline-capable web app for reading the Qur'an together with your extracted study notes. Installable to your phone and laptop home screen. No backend, no accounts, no subscription — just static files.

Each sūrah has three tabs: **Qur'an** (the full Arabic text — tap any āyah to jump to its Concise note), **Concise**, and **Deeper Look**. Plus full-text search, bookmarks, resume, dark mode, and adjustable text size.

**Personal copy for your own study — don't redistribute the study notes.**

**Qur'an text:** loaded at runtime from the open [`quran-json`](https://www.npmjs.com/package/quran-json) dataset via the jsDelivr CDN (Uthmani script, public-domain scripture). It's cached for offline after the first online view, or all at once via **⚙ → Offline → Download all**. The study notes are bundled in `data/`.

---

## What's inside

```
revealed-pwa/
  index.html            app shell
  styles.css            the Revealed look (maroon on cream, serif display)
  app.js                all the logic (list, reader, search, bookmarks, dark mode)
  manifest.webmanifest  PWA manifest (name, icons, theme colour)
  sw.js                 service worker (offline caching)
  icons/                app icons (starburst mark)
  data/
    index.json          list of all 114 sūrahs
    surah-1.json … surah-114.json   commentary per sūrah (Concise + Deeper Look)
```

Features: all 114 sūrahs, Concise / Deeper Look tabs, full-text search, bookmarks, resume-where-you-left-off, light/dark mode, adjustable text size, and full offline use once cached.

---

## 1. Preview it on your computer (30 seconds)

A PWA can't run straight from a double-clicked file — it needs to be *served*. Easiest way, using the Terminal:

```bash
cd "/Users/mochammadtontowi/Documents/Project/Quran Commentary/revealed-pwa"
python3 -m http.server 8080
```

Then open **http://localhost:8080** in Brave. That's the real app. (Press `Ctrl+C` in Terminal to stop the server.)

---

## 2. Put it online + install on your phone (GitHub Pages)

To install it as an app on your phone, it needs to be on HTTPS. GitHub Pages does this free — same flow as your exam platform.

### First push (repo: `estemirza/guidance`)

Run in Terminal on your laptop:

```bash
cd "/Users/mochammadtontowi/Documents/Project/Quran Commentary/revealed-pwa"
git init
git add .
git commit -m "Guidance — personal Qur'an reader (v1)"
git branch -M main
git remote add origin https://github.com/estemirza/guidance.git
git push -u origin main
```

- **If the repo already has a commit** (e.g. an auto-created README), the push is rejected. Run `git pull --rebase origin main` then `git push`. If it's truly empty and you're sure, `git push -u origin main --force`.
- **Auth:** GitHub won't accept your password. When prompted, paste a **Personal Access Token** (GitHub → Settings → Developer settings → Tokens) as the password, or run `gh auth login` first.

### Turn on hosting

On GitHub: **Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/root` → Save.**
Wait ~1 minute. Your app is live at **https://estemirza.github.io/guidance/** (the app uses relative paths, so the sub-path works fine).

### Install on your phone

Open that URL on your phone:
- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome/Brave):** menu → *Install app* / *Add to Home Screen*.

Then open it once while online and tap **⚙ → Offline → Download all** to cache the Qur'an + notes for offline use.

### Later updates

```bash
git add .
git commit -m "describe the change"
git push
```

> Privacy: if `estemirza/guidance` is public, the bundled study notes are publicly visible, and on a free plan GitHub Pages only serves public repos anyway. Since this is your personal copy of licensed material, keep the URL to yourself — or put a login in front of it (e.g. Cloudflare Access) if you want it genuinely private. Ask me and I'll help set that up.

---

## 3. Updating the commentary later

When you translate more into Indonesian, or Bayyinah publishes new Deeper Look passages and you re-extract them, the app just needs its `data/` regenerated from the EN (or ID) folder. Ask me to "rebuild the PWA data" and I'll refresh `data/` — then you commit + push again.

---

## Tech notes (for the CS side)

- **No framework, no build step.** Plain HTML + CSS + vanilla JS, hash-routed single-page app. Everything runs from static files.
- **Service worker** caches the app shell on install and each sūrah on first open (cache-first for `data/surah-*.json`, stale-while-revalidate for the shell). Fonts from Google Fonts are cached at runtime too.
- **Search** loads every sūrah once (cached), strips the HTML to text in memory, and does a substring match over heading-level passages — no server, no search library.
- **Data** is pre-rendered from Markdown to HTML at build time, so the client never needs a Markdown parser.

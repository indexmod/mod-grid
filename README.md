

# 📘 README — GRID (stable v1 rollback state)

## 🧠 Описание

**GRID** — это минималистичная сеточная система карточек с:

* текстом (редактируемым)
* изображениями по ссылке (paste)
* синхронизацией через Cloudflare KV
* drag & drop (опционально)
* autosave через debounce

---

# ⚡ СТАБИЛЬНАЯ ВЕРСИЯ (ЗАФИКСИРОВАНА)

Эта версия считается **rollback point**, если что-то ломается в дальнейшем.

---

# 📦 Структура

```
worker.js      → API + KV storage
index.html     → UI
index.css      → grid layout + cards
index.js       → state + sync + edit logic
```

---

# 🧩 ФУНКЦИОНАЛ (STABLE)

## ✔ карточки

* 4 колонки grid layout
* адаптивность (4 → 3 → 2 → 1)

## ✔ текст

* textarea редактируемый
* autosize по контенту
* debounce save (300ms)

## ✔ изображения

* вставка через paste URL
* автоматическое отображение
* скрытие пустых img (без плейсхолдера)

## ✔ синхронизация

* polling каждые 2s
* KV как источник истины

---

# 🧠 АРХИТЕКТУРНЫЙ ПРИНЦИП

> STATE FIRST SYSTEM

* posts[] = единственный источник истины
* DOM = производное состояния
* KV = persistence layer

---

# 🔥 ROLLBACK ИНСТРУКЦИЯ

Если что-то сломалось:

---

## 1. Откат JS

```bash
git checkout <stable-commit>
```

или вручную вернуть:

```
index.js (stable v3 fixed)
```

---

## 2. Проверка CSS

Убедись что НЕТ:

```css
#grid { display: flex; }
```

и НЕТ inline `<style>` в HTML

---

## 3. Проверка API

Worker должен содержать:

* `/api/feed`
* `/api/paste`
* `/api/update`
* `/api/reorder`

---

## 4. KV binding

wrangler.jsonc:

```json
{
  "kv_namespaces": [
    {
      "binding": "GRID",
      "id": "YOUR_KV_ID"
    }
  ]
}
```

---

## 5. Быстрый health-check

Открыть консоль:

```js
document.getElementById("grid").children.length
```

→ должно совпадать с количеством постов

---

# 🧷 KNOWN WORKING BEHAVIOR

✔ paste image → сразу появляется
✔ text edit → autosave
✔ sync → без перерендера DOM
✔ empty image → не рендерится
✔ grid → 4 columns stable

---

# ⚠️ НЕ ДЕЛАТЬ В БУДУЩЕМ

❌ не добавлять inline `<style>` в HTML
❌ не смешивать flex + grid на #grid
❌ не делать full re-render каждые 2s
❌ не хранить DOM как source of truth

---

# 🚀 СЛЕДУЮЩАЯ ВЕРСИЯ (когда будешь готов)

GRID v2 roadmap:

* embed links preview cards
* image thumbnails (top-left block mode)
* drag reorder stable (no flicker)
* R2 storage instead of KV
* block-based cards (Notion style)

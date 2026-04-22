Публичная сетка: https://grid.indexmod.press/ — просмотр карточек и редактирование текста с автосохранением.
Админка: https://grid.indexmod.press/admin — создание, редактирование (изображение, заголовок, текст) и удаление карточек.



# 📦 GRID / INDEX SYSTEM

Лёгкая KV-основанная система публикаций с двумя интерфейсами:

* **Admin page** — редактирование контента
* **Index page** — публичный живой поток
* **Cloud Worker (Cloudflare KV)** — единый источник данных

---

# 🧠 Архитектура

```
Admin UI → /api/paste, /api/update, /api/delete
Index UI → /api/feed (polling sync)
Cloudflare Worker → KV storage (GRID.feed)
```

---

# 📄 DATA MODEL

Каждый пост хранится в KV как:

```js
{
  id: Number,
  title: String,
  image: String,
  comment: String,
  order: Number
}
```

---

# 🧩 INDEX PAGE (PUBLIC VIEW)

## 📍 Файл: index.html + index.js

### Функции:

#### 📥 Загрузка данных

* Получает посты через:

```
GET /api/feed
```

#### 🔄 Live sync (каждые 2 секунды)

* Подтягивает изменения с сервера
* Обновляет DOM без перерендера всей страницы

#### 🧱 Отображение поста

* image (если есть)
* title (заголовок)
* comment (редактируемое поле)

#### ✍️ Редактирование comment

* debounce (300ms)
* авто-отправка в API:

```
POST /api/update
```

---

## ⚙️ Особенности индекса

* Server is source of truth
* DOM обновляется диффами
* Нет локального состояния (кроме input debounce)
* Safe sync без конфликтов состояния

---

# 🛠 ADMIN PAGE

## 📍 Файл: admin.html + admin.js

### Функции:

#### ➕ Создание поста

```
POST /api/paste
```

Создаёт пустой пост:

```js
title: ""
image: ""
comment: ""
```

---

#### ✏️ Редактирование

Поля:

* 📎 Ссылка (image URL)
* 🧾 Заголовок
* 💬 Комментарий

Редактирование:

* локально (без автосейва)
* сохраняется вручную через:

```
"Отправить"
→ POST /api/update
```

---

#### 🗑 Удаление

```
POST /api/delete
```

Удаляет пост из KV

---

#### 📤 Отправка в облако

Кнопка:

```
Отправить
```

Отправляет весь объект:

```js
{
  id,
  title,
  image,
  comment
}
```

---

# ⚙️ BACKEND (CLOUDFLARE WORKER)

## 📍 endpoints

---

### 📥 GET FEED

```
GET /api/feed
```

Возвращает:

```js
{
  ok: true,
  data: [...]
}
```

---

### ➕ CREATE POST

```
POST /api/paste
```

Создаёт новый пост в KV.

---

### ✏️ UPDATE POST

```
POST /api/update
```

Обновляет поля:

* title
* image
* comment

---

### 🗑 DELETE POST

```
POST /api/delete
```

Удаляет пост по id

---

### 🔁 REORDER

```
POST /api/reorder
```

Обновляет порядок элементов (order field)

---

# 🧠 DATA FLOW

## Admin:

```
input → local state → manual push → KV
```

## Index:

```
KV → sync → DOM diff update
```

---

# 🔄 SYNC STRATEGY (INDEX)

* polling каждые 2s
* server diff → DOM patch
* textarea защищён debounce timer’ом
* title/image обновляются мгновенно

---

# ⚠️ DESIGN PRINCIPLES

### ✔ server is truth

### ✔ no dual state conflicts

### ✔ no uncontrolled autosave spam

### ✔ minimal DOM re-rendering

### ✔ KV as single persistence layer

---

# 🚀 FUTURE EXTENSIONS

Система уже готова для:

* realtime sync (WebSocket / Durable Objects)
* offline-first editor
* versioning posts
* markdown support
* history rollback
* collaborative editing

---

# 🧩 SUMMARY

Это не CMS и не блог.

Это:

> lightweight distributed content grid
> with manual editorial control + live public projection

Предыдущая версия

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

# 🚀 Інструкції для розгортання на Render

## 📋 Що потрібно розгорнути:

1. **API Server** (Express сервер)
2. **Telegram Bot** (Worker сервіс)
3. **React Frontend** (Static Site)

## 🔗 GitHub репозиторій:
https://github.com/TracerStudio/defi-exchange-render

---

## 1️⃣ Розгортання API Server

### Крок 1: Створення Web Service
1. Зайдіть на https://render.com
2. Натисніть "New +" → "Web Service"
3. Підключіть GitHub репозиторій: `TracerStudio/defi-exchange-render`

### Крок 2: Налаштування API Server
```
Name: defi-api-server
Environment: Node
Build Command: npm install
Start Command: npm run admin
Plan: Free
Region: Oregon (US West)
```

### Крок 3: Environment Variables
```
NODE_ENV=production
PORT=10000
BOT_URL=https://defi-telegram-bot.onrender.com
```

---

## 2️⃣ Розгортання Telegram Bot

### Крок 1: Створення Background Worker
1. Натисніть "New +" → "Background Worker"
2. Виберіть той самий репозиторій

### Крок 2: Налаштування Bot
```
Name: defi-telegram-bot
Environment: Node
Build Command: cd telegram-bot && npm install
Start Command: cd telegram-bot && npm start
Plan: Free
Region: Oregon (US West)
```

### Крок 3: Environment Variables
```
NODE_ENV=production
PORT=10001
BOT_TOKEN=7769270215:AAH_R-Q14oxkKHU0a53xK4_evXWiQJBiO54
ADMIN_CHAT_ID=-1002573326301
```

---

## 3️⃣ Розгортання React Frontend

### Крок 1: Створення Static Site
1. Натисніть "New +" → "Static Site"
2. Виберіть той самий репозиторій

### Крок 2: Налаштування Frontend
```
Name: defi-frontend
Build Command: npm run build
Publish Directory: build
Plan: Free
Region: Oregon (US West)
```

---

## 🔧 Після розгортання:

1. **Отримайте URL сервісів:**
   - API Server: `https://defi-api-server.onrender.com`
   - Telegram Bot: `https://defi-telegram-bot.onrender.com`
   - Frontend: `https://defi-frontend.onrender.com`

2. **Оновіть BOT_URL в API Server:**
   - Зайдіть в налаштування API Server
   - Оновіть змінну `BOT_URL` на URL Telegram Bot

3. **Перевірте роботу:**
   - Frontend: https://defi-frontend.onrender.com
   - API Health: https://defi-api-server.onrender.com/health
   - Bot Health: https://defi-telegram-bot.onrender.com/health

---

## ⚠️ Важливі нотатки:

- **Free план** має обмеження: сервіси "засинають" після 15 хвилин неактивності
- **Перший запуск** може зайняти 2-3 хвилини
- **Telegram Bot** потребує активного webhook або polling
- **Database файли** зберігаються в файловій системі (не постійно на Free плані)

---

## 🎯 Результат:
Після розгортання у вас буде повнофункціональна DeFi платформа з:
- ✅ React фронтенд
- ✅ Express API сервер  
- ✅ Telegram бот для заявок на вивід
- ✅ Синхронізація балансів між пристроями
- ✅ Адмін панель

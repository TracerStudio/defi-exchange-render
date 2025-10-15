# 🚀 Інструкції для деплою на Render

## ⚠️ ВАЖЛИВО: Перед початком

**Переконайтеся, що всі файли збережені та закомічені в Git!**

```bash
git add .
git commit -m "Fix deploy configuration"
git push origin master
```

## 📋 Передумови

1. ✅ Зареєструйтеся на [Render.com](https://render.com)
2. ✅ Підключіть ваш GitHub репозиторій до Render
3. ✅ Створіть Telegram бота через [@BotFather](https://t.me/botfather)

## 🤖 Крок 1: Підготовка Telegram бота

1. Напишіть [@BotFather](https://t.me/botfather) в Telegram
2. Виконайте команду `/newbot`
3. Введіть назву та username для бота
4. **ЗБЕРЕЖІТЬ** отриманий токен (виглядає як `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Отримайте ваш Chat ID:
   - Напишіть боту повідомлення
   - Перейдіть за посиланням: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Знайдіть `chat.id` в відповіді (виглядає як `123456789` або `-1001234567890`)

## 🌐 Крок 2: Автоматичний деплой через Blueprint

**Рекомендований спосіб:**

1. У Render Dashboard натисніть **"New +"** → **"Blueprint"**
2. Підключіть ваш GitHub репозиторій
3. Render автоматично створить обидва сервіси з файлу `render.yaml`
4. **ВАЖЛИВО**: Після створення сервісів додайте змінні середовища для бота:
   - `TELEGRAM_BOT_TOKEN` = ваш токен бота
   - `ADMIN_CHAT_ID` = ваш Chat ID

## 🔧 Крок 3: Ручний деплой (якщо Blueprint не працює)

### 3.1 Деплой основного сервісу

1. У Render Dashboard натисніть **"New +"** → **"Web Service"**
2. Підключіть ваш GitHub репозиторій
3. Налаштуйте сервіс:
   - **Name**: `defi-exchange-platform`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
   - **Dockerfile Path**: `./Dockerfile`

4. Додайте змінні середовища:
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `BOT_URL` = `https://defi-bot.onrender.com`

5. Натисніть **"Create Web Service"**

### 3.2 Деплой Telegram бота

1. У Render Dashboard натисніть **"New +"** → **"Web Service"**
2. Підключіть той же GitHub репозиторій
3. Налаштуйте сервіс:
   - **Name**: `defi-bot`
   - **Environment**: `Node`
   - **Build Command**: `cd telegram-bot && npm ci`
   - **Start Command**: `cd telegram-bot && npm start`
   - **Plan**: `Free`

4. **ОБОВ'ЯЗКОВО** додайте змінні середовища:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `TELEGRAM_BOT_TOKEN` = ваш токен бота
   - `ADMIN_CHAT_ID` = ваш Chat ID

5. Натисніть **"Create Web Service"**

## 🔄 Крок 4: Оновлення URL бота

1. Після успішного деплою бота, скопіюйте його URL
2. Перейдіть до налаштувань основного сервісу
3. Оновіть змінну `BOT_URL` на URL вашого бота

## ✅ Крок 5: Перевірка роботи

1. Відкрийте URL основного сервісу
2. Перевірте health check: `https://your-app.onrender.com/health`
3. Перевірте підключення до бота: `https://your-app.onrender.com/test-bot-connection`

## Структура проекту

```
├── src/                    # React додаток
├── telegram-bot/           # Telegram бот
├── admin-server.js         # Express сервер
├── render.yaml            # Конфігурація Render
├── Dockerfile             # Docker контейнер
└── package.json           # Залежності Node.js
```

## 🚨 Вирішення поширених проблем

### ❌ Помилка "Build failed"
**Причина**: Конфлікти залежностей або неправильна конфігурація
**Рішення**:
```bash
# Очистіть кеш та перевстановіть залежності
rm -rf node_modules package-lock.json
npm install
git add . && git commit -m "Fix dependencies" && git push
```

### ❌ Помилка CORS
**Причина**: Неправильний `BOT_URL` або сервіси не запущені
**Рішення**:
- Переконайтеся, що `BOT_URL` правильно налаштований
- Перевірте, що обидва сервіси запущені
- Перевірте логи в Render Dashboard

### ❌ Бот не відповідає
**Причина**: Неправильний токен або Chat ID
**Рішення**:
- Перевірте токен бота (має починатися з цифр)
- Переконайтеся, що Chat ID правильний
- Перевірте логи бота в Render Dashboard
- Переконайтеся, що змінні середовища встановлені

### ❌ "Service unavailable" або "502 Bad Gateway"
**Причина**: Сервіс не запускається
**Рішення**:
- Перевірте логи в Render Dashboard
- Переконайтеся, що порт правильний (3000 для основного, 3001 для бота)
- Перевірте, що всі змінні середовища встановлені

### ❌ Помилки збірки React
**Причина**: Проблеми з залежностями або конфігурацією
**Рішення**:
- Переконайтеся, що всі залежності вказані в `package.json`
- Перевірте, що Node.js версія сумісна (18 LTS)
- Очистіть кеш: `npm cache clean --force`

### ❌ Telegram бот не запускається
**Причина**: Відсутні змінні середовища
**Рішення**:
- Переконайтеся, що `TELEGRAM_BOT_TOKEN` та `ADMIN_CHAT_ID` встановлені
- Перевірте формат токена (без пробілів)
- Перевірте формат Chat ID (може бути негативним для груп)

## 🔍 Діагностика проблем

### Перевірка логів
1. У Render Dashboard перейдіть до вашого сервісу
2. Натисніть вкладку **"Logs"**
3. Шукайте помилки з червоними позначками ❌

### Тестування локально
```bash
# Тест основного сервісу
npm install
npm run build
npm start

# Тест бота
cd telegram-bot
npm install
npm start
```

### Перевірка змінних середовища
У Render Dashboard → ваш сервіс → **"Environment"** переконайтеся, що:
- `NODE_ENV=production`
- `PORT=3000` (або 3001 для бота)
- `TELEGRAM_BOT_TOKEN` встановлено (для бота)
- `ADMIN_CHAT_ID` встановлено (для бота)
- `BOT_URL` встановлено (для основного сервісу)

## Підтримка

Якщо виникли проблеми:
1. Перевірте логи в Render Dashboard
2. Переконайтеся, що всі змінні середовища встановлені
3. Перевірте, що обидва сервіси запущені та доступні

## Автоматичний деплой

Для автоматичного деплою використовуйте файл `render.yaml`:
1. Завантажте його в корінь репозиторію
2. У Render Dashboard натисніть "New +" → "Blueprint"
3. Підключіть репозиторій
4. Render автоматично створить обидва сервіси

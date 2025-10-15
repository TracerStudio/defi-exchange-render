#!/bin/bash

echo "🤖 Starting Telegram Withdrawal Bot..."

# Перевіряємо чи встановлені залежності
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Перевіряємо чи налаштовані змінні
if grep -q "YOUR_BOT_TOKEN_HERE" bot.js; then
    echo "❌ Please configure BOT_TOKEN in bot.js"
    echo "1. Create bot with @BotFather"
    echo "2. Get your Chat ID"
    echo "3. Update bot.js with your tokens"
    exit 1
fi

if grep -q "YOUR_ADMIN_CHAT_ID_HERE" bot.js; then
    echo "❌ Please configure ADMIN_CHAT_ID in bot.js"
    echo "1. Send message to your bot"
    echo "2. Get Chat ID from https://api.telegram.org/bot<TOKEN>/getUpdates"
    echo "3. Update bot.js with your Chat ID"
    exit 1
fi

echo "✅ Configuration looks good!"
echo "🚀 Starting bot server on port 3001..."

# Запускаємо бота
npm start

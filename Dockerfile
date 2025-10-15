# Використовуємо Node.js 18 LTS як базовий образ
FROM node:18-alpine

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package.json
COPY package.json ./

# Очищаємо кеш npm та встановлюємо залежності
RUN npm cache clean --force && npm install --legacy-peer-deps

# Копіюємо весь проект
COPY . .

# Створюємо директорію для бази даних
RUN mkdir -p database

# Збираємо React додаток
RUN npm run build

# Видаляємо dev dependencies після збірки
RUN npm prune --production

# Відкриваємо порт
EXPOSE 3000

# Встановлюємо змінні середовища
ENV NODE_ENV=production
ENV PORT=3000

# Запускаємо сервер
CMD ["npm", "start"]
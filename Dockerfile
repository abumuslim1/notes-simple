# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Установка pnpm
RUN npm install -g pnpm

# Копирование файлов зависимостей и patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Установка зависимостей
RUN pnpm install --frozen-lockfile

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN pnpm build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Установка необходимых пакетов
RUN apk add --no-cache wget

# Установка pnpm
RUN npm install -g pnpm

# Копирование package.json, pnpm-lock.yaml и patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Установка только production зависимостей
RUN pnpm install --frozen-lockfile --prod

# Копирование собранного приложения из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Копирование drizzle конфигурации и схемы (для миграций)
COPY drizzle.config.ts ./
COPY --from=builder /app/drizzle ./drizzle

# Создание директории для БД
RUN mkdir -p /app/data

# Открытие порта
EXPOSE 3000

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/notes.db

# Запуск приложения
CMD ["node", "dist/index.js"]

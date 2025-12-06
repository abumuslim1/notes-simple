#!/bin/bash

# Notes Service - Setup Script
# Этот скрипт автоматизирует процесс установки и настройки Notes Service

set -e

echo "======================================================================="
echo "  Notes Service - Setup Script"
echo "======================================================================="
echo ""

# Проверка Node.js
echo "📋 Проверка зависимостей..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 18+ с https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) установлен"

# Проверка pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm не установлен. Установка pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm -v) установлен"
echo ""

# Установка зависимостей
echo "📦 Установка зависимостей проекта..."
pnpm install
echo "✅ Зависимости установлены"
echo ""

# Проверка .env.local
echo "⚙️  Проверка конфигурации..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Файл .env.local не найден"
    echo ""
    echo "Требуется создать файл .env.local с переменными окружения."
    echo "Пример переменных:"
    echo ""
    echo "  DATABASE_URL=mysql://user:password@localhost:3306/notes_service"
    echo "  JWT_SECRET=your-secret-key"
    echo "  VITE_APP_ID=your-app-id"
    echo "  OAUTH_SERVER_URL=https://api.manus.im"
    echo "  VITE_OAUTH_PORTAL_URL=https://portal.manus.im"
    echo "  OWNER_NAME=Your Name"
    echo "  OWNER_OPEN_ID=your-open-id"
    echo "  BUILT_IN_FORGE_API_URL=https://api.manus.im"
    echo "  BUILT_IN_FORGE_API_KEY=your-api-key"
    echo "  VITE_FRONTEND_FORGE_API_URL=https://api.manus.im"
    echo "  VITE_FRONTEND_FORGE_API_KEY=your-frontend-key"
    echo ""
    echo "Пожалуйста, создайте файл .env.local и попробуйте снова."
    exit 1
fi

echo "✅ Файл .env.local найден"
echo ""

# Инициализация БД
echo "🗄️  Инициализация базы данных..."
if pnpm db:push; then
    echo "✅ База данных инициализирована"
else
    echo "⚠️  Ошибка при инициализации БД. Проверьте DATABASE_URL в .env.local"
    exit 1
fi
echo ""

# Запуск тестов
echo "🧪 Запуск тестов..."
if pnpm test; then
    echo "✅ Все тесты пройдены"
else
    echo "⚠️  Некоторые тесты не прошли. Проверьте логи выше."
    exit 1
fi
echo ""

echo "======================================================================="
echo "  ✅ Setup завершен успешно!"
echo "======================================================================="
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Запустите приложение:"
echo "   pnpm dev"
echo ""
echo "2. Откройте браузер и перейдите на:"
echo "   http://localhost:3000"
echo ""
echo "3. Перейдите на страницу Лицензии для активации"
echo ""
echo "Документация: см. INSTALLATION.md"
echo ""

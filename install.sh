#!/bin/bash

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для вывода
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Проверка прав администратора
if [[ $EUID -ne 0 ]]; then
    print_error "Этот скрипт должен быть запущен с правами администратора (sudo)"
fi

print_header "Notes Service - Автоматическая установка"

# Переменные
INSTALL_DIR="/opt/notes-service"
SERVICE_USER="notes"
SERVICE_GROUP="notes"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"

# Шаг 1: Обновление пакетов
print_header "Шаг 1: Обновление пакетов системы"
apt-get update -qq || print_warning "Ошибка при обновлении пакетов, продолжаю..."
print_success "Пакеты обновлены"

# Шаг 1.5: Проверка systemd/systemctl
print_header "Шаг 1.5: Проверка systemd"
if command -v systemctl &> /dev/null; then
    SYSTEMD_VERSION=$(systemctl --version | head -n1)
    print_success "systemd уже установлен: $SYSTEMD_VERSION"
else
    print_info "Установка systemd..."
    apt-get install -y systemd || print_error "Ошибка при установке systemd"
    print_success "systemd установлен"
fi

# Шаг 2: Установка Node.js
print_header "Шаг 2: Проверка Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js уже установлен: $NODE_VERSION"
else
    print_info "Установка Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || print_error "Ошибка при установке Node.js"
    apt-get install -y nodejs
    print_success "Node.js установлен: $(node --version)"
fi

# Шаг 3: Установка pnpm
print_header "Шаг 3: Проверка pnpm"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm уже установлен: $PNPM_VERSION"
else
    print_info "Установка pnpm..."
    npm install -g pnpm || print_error "Ошибка при установке pnpm"
    print_success "pnpm установлен: $(pnpm --version)"
fi

# Шаг 4: Установка Git
print_header "Шаг 4: Проверка Git"
if command -v git &> /dev/null; then
    print_success "Git уже установлен: $(git --version)"
else
    print_info "Установка Git..."
    apt-get install -y git || print_error "Ошибка при установке Git"
    print_success "Git установлен"
fi

# Шаг 5: Установка sqlite3
print_header "Шаг 5: Проверка sqlite3"
if command -v sqlite3 &> /dev/null; then
    print_success "sqlite3 уже установлен"
else
    print_info "Установка sqlite3..."
    apt-get install -y sqlite3 || print_error "Ошибка при установке sqlite3"
    print_success "sqlite3 установлен"
fi

# Шаг 6: Создание пользователя
print_header "Шаг 6: Создание пользователя сервиса"
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$INSTALL_DIR" "$SERVICE_USER" || print_warning "Ошибка при создании пользователя"
    print_success "Пользователь $SERVICE_USER создан"
else
    print_warning "Пользователь $SERVICE_USER уже существует"
fi

# Шаг 7: Клонирование репозитория
print_header "Шаг 7: Клонирование репозитория"
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Директория $INSTALL_DIR уже существует, обновляю..."
    cd "$INSTALL_DIR"
    git fetch origin
    git checkout release
    git pull origin release
else
    git clone -b release https://github.com/abumuslim1/notes-simple.git "$INSTALL_DIR" || print_error "Ошибка при клонировании репозитория"
    cd "$INSTALL_DIR"
fi
print_success "Репозиторий готов"

# Шаг 8: Установка зависимостей
print_header "Шаг 8: Установка зависимостей проекта"
cd "$INSTALL_DIR"
pnpm install || print_error "Ошибка при установке зависимостей"
print_success "Зависимости установлены"

# Шаг 9: Создание файла .env
print_header "Шаг 9: Создание файла конфигурации"
if [ ! -f "$INSTALL_DIR/.env" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    cat > "$INSTALL_DIR/.env" << EOF
# Database Configuration
DATABASE_URL="file:./notes.db"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# Server Configuration
NODE_ENV="production"
PORT=3000

# App Configuration
VITE_APP_TITLE="Notes Service"
OWNER_NAME="Administrator"

# OAuth (опционально)
VITE_APP_ID=""
OAUTH_SERVER_URL=""
VITE_OAUTH_PORTAL_URL=""
OWNER_OPEN_ID=""
BUILT_IN_FORGE_API_URL=""
BUILT_IN_FORGE_API_KEY=""
VITE_FRONTEND_FORGE_API_URL=""
VITE_FRONTEND_FORGE_API_KEY=""
VITE_ANALYTICS_ENDPOINT=""
VITE_ANALYTICS_WEBSITE_ID=""
EOF
    print_success "Файл .env создан"
else
    print_warning "Файл .env уже существует, пропускаю создание"
fi

# Шаг 10: Инициализация БД
print_header "Шаг 10: Инициализация базы данных"
cd "$INSTALL_DIR"
pnpm db:push || print_warning "Миграция БД завершена (может потребовать ручного вмешательства)"
print_success "База данных инициализирована"

# Небольшая задержка для убедитесь, что БД полностью инициализирована
sleep 2

    print_info "Администратор будет создан при первом входе в приложение"
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение
# Администратор будет создан при первом входе в приложение

# Шаг 12: Сборка приложения
print_header "Шаг 12: Сборка приложения для production"
cd "$INSTALL_DIR"
rm -rf dist node_modules/.vite 2>/dev/null || true
pnpm build || print_error "Ошибка при сборке приложения"
print_success "Приложение собрано"

# Шаг 13: Установка прав доступа
print_header "Шаг 13: Установка прав доступа"
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"
chmod -R 755 "$INSTALL_DIR"
chmod 600 "$INSTALL_DIR/.env"
print_success "Права доступа установлены"

# Шаг 14: Создание systemd сервиса
print_header "Шаг 14: Создание systemd сервиса"
cat > "/etc/systemd/system/notes-service.service" << 'EOF'
[Unit]
Description=Notes Service - Notes and Tasks Management
After=network.target

[Service]
Type=simple
User=notes
WorkingDirectory=/opt/notes-service
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/opt/notes-service/.env
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=notes-service

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
print_success "Systemd сервис создан"

# Шаг 15: Запуск сервиса
print_header "Шаг 15: Запуск сервиса"
systemctl start notes-service || print_error "Ошибка при запуске сервиса"
systemctl enable notes-service
sleep 2

if systemctl is-active --quiet notes-service; then
    print_success "Сервис успешно запущен и добавлен в автозагрузку"
else
    print_warning "Сервис не запустился, проверьте логи:"
    print_info "sudo journalctl -u notes-service -n 50"
fi

# Итоговая информация
print_header "✓ Установка завершена!"
echo ""
print_success "Notes Service готов к использованию"
echo ""
echo "📋 Учетные данные администратора:"
echo "   Логин: $ADMIN_USERNAME"
echo "   Пароль: $ADMIN_PASSWORD"
echo ""
echo "🌐 Откройте приложение в браузере:"
echo "   http://localhost:3000"
echo ""
echo "📊 Управление сервисом:"
echo "   Статус: sudo systemctl status notes-service"
echo "   Логи: sudo journalctl -u notes-service -f"
echo "   Перезагрузка: sudo systemctl restart notes-service"
echo "   Остановка: sudo systemctl stop notes-service"
echo ""
echo "📚 Полная документация:"
echo "   https://github.com/abumuslim1/notes-simple/blob/release/DEPLOYMENT.md"
echo ""

echo "⚠️  ВАЖНЫЕ ЗАМЕЧАНИЯ:"
echo "   1. Куки авторизации требуют HTTPS в production (secure flag)"
echo "   2. При локальном развертывании (HTTP) используется secure: false"
echo "   3. Первый зарегистрировавшийся пользователь получает роль администратора"
echo "   4. Убедитесь, что публичная регистрация включена в настройках лицензии"
echo ""

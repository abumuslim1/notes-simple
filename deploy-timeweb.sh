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

print_header "Notes Service - Развертывание на Timeweb Cloud"

# Переменные
INSTALL_DIR="/opt/notes-service"
APP_PORT=3000

# Шаг 1: Обновление системы
print_header "Шаг 1: Обновление системы"
apt-get update -qq || print_warning "Ошибка при обновлении пакетов"
apt-get upgrade -y -qq || print_warning "Ошибка при обновлении пакетов"
print_success "Система обновлена"

# Шаг 2: Установка Docker
print_header "Шаг 2: Установка Docker"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker уже установлен: $DOCKER_VERSION"
else
    print_info "Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker установлен: $(docker --version)"
fi

# Шаг 3: Установка Docker Compose
print_header "Шаг 3: Установка Docker Compose"
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose уже установлен: $COMPOSE_VERSION"
else
    print_info "Установка Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose установлен: $(docker-compose --version)"
fi

# Шаг 4: Установка Git
print_header "Шаг 4: Проверка Git"
if command -v git &> /dev/null; then
    print_success "Git уже установлен: $(git --version)"
else
    print_info "Установка Git..."
    apt-get install -y git
    print_success "Git установлен"
fi

# Шаг 5: Клонирование репозитория
print_header "Шаг 5: Клонирование репозитория"
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

# Шаг 6: Создание файла .env
print_header "Шаг 6: Создание файла конфигурации"
if [ ! -f "$INSTALL_DIR/.env" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    cat > "$INSTALL_DIR/.env" << EOF
# Основные переменные
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=file:/app/data/notes.db

# Безопасность
JWT_SECRET="$JWT_SECRET"

# Приложение
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
    print_info "JWT_SECRET: $JWT_SECRET"
else
    print_warning "Файл .env уже существует, пропускаю создание"
fi

# Шаг 7: Создание директории для БД
print_header "Шаг 7: Создание директории для данных"
mkdir -p "$INSTALL_DIR/data"
chmod 755 "$INSTALL_DIR/data"
print_success "Директория для данных создана"

# Шаг 8: Запуск приложения с Docker Compose
print_header "Шаг 8: Запуск приложения"
cd "$INSTALL_DIR"
docker-compose down 2>/dev/null || true
docker-compose up -d --build || print_error "Ошибка при запуске приложения"
print_success "Приложение запущено"

# Шаг 9: Проверка статуса
print_header "Шаг 9: Проверка статуса"
sleep 5
docker-compose ps

# Проверка здоровья приложения
if docker-compose ps | grep -q "healthy\|running"; then
    print_success "Приложение успешно запущено"
else
    print_warning "Приложение может быть еще в процессе запуска, проверьте логи:"
    print_info "docker-compose logs -f app"
fi

# Шаг 10: Установка Nginx (опционально)
print_header "Шаг 10: Установка Nginx (опционально)"
read -p "Установить и настроить Nginx как reverse proxy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt-get install -y nginx
    
    cat > /etc/nginx/sites-available/notes-service << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/notes-service /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t && systemctl restart nginx
    print_success "Nginx установлен и настроен"
else
    print_info "Nginx не установлен, приложение доступно на порту $APP_PORT"
fi

# Итоговая информация
print_header "✓ Развертывание завершено!"
echo ""
print_success "Notes Service готов к использованию"
echo ""
echo "🌐 Откройте приложение в браузере:"
echo "   http://your-server-ip:$APP_PORT"
echo ""
echo "📊 Управление приложением:"
echo "   Логи: docker-compose -f $INSTALL_DIR/docker-compose.yml logs -f app"
echo "   Статус: docker-compose -f $INSTALL_DIR/docker-compose.yml ps"
echo "   Перезагрузка: docker-compose -f $INSTALL_DIR/docker-compose.yml restart"
echo "   Остановка: docker-compose -f $INSTALL_DIR/docker-compose.yml down"
echo ""
echo "💾 Резервная копия БД:"
echo "   docker-compose -f $INSTALL_DIR/docker-compose.yml exec app cp /app/data/notes.db /app/data/notes.db.backup"
echo ""
echo "🔐 Важно:"
echo "   1. Измените JWT_SECRET в файле .env на новый"
echo "   2. Установите SSL сертификат (Let's Encrypt)"
echo "   3. Настройте доменное имя в Nginx конфигурации"
echo "   4. Первый пользователь будет администратором"
echo ""
echo "📚 Полная документация:"
echo "   $INSTALL_DIR/TIMEWEB_DEPLOYMENT.md"
echo ""

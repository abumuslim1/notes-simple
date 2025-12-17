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
    print_info "Docker уже установлен"
else
    print_info "Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker установлен"
fi

# Настройка Docker для обхода rate limit
print_info "Настройка Docker для обхода rate limit..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.gcr.io"
  ],
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 3,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Перезапуск Docker для применения настроек
if systemctl is-active --quiet docker; then
    print_info "Перезапуск Docker..."
    systemctl restart docker
    sleep 3
    print_success "Docker перезапущен"
fi

# Шаг 3: Установка Docker Compose
print_header "Шаг 3: Установка Docker Compose"
if command -v docker-compose &> /dev/null; then
    print_info "Docker Compose уже установлен"
else
    print_info "Установка Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose установлен"
fi

# Шаг 4: Установка Git
print_header "Шаг 4: Установка Git"
if command -v git &> /dev/null; then
    print_info "Git уже установлен"
else
    print_info "Установка Git..."
    apt-get install -y git
    print_success "Git установлен"
fi

# Шаг 5: Клонирование репозитория
print_header "Шаг 5: Клонирование репозитория"
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Директория $INSTALL_DIR уже существует"
    read -p "Удалить и клонировать заново? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        print_info "Директория удалена"
    else
        print_info "Используем существующую директорию"
        cd "$INSTALL_DIR"
        git pull origin release || print_warning "Ошибка при обновлении репозитория"
    fi
fi

if [ ! -d "$INSTALL_DIR" ]; then
    print_info "Клонирование репозитория..."
    cd /opt
    git clone -b release https://github.com/abumuslim1/notes-simple.git notes-service
    print_success "Репозиторий клонирован"
fi

cd "$INSTALL_DIR"

# Шаг 6: Создание конфигурации
print_header "Шаг 6: Создание конфигурации"
if [ -f ".env" ]; then
    print_warning "Файл .env уже существует, пропускаем создание"
else
    print_info "Создание файла .env..."
    JWT_SECRET=$(openssl rand -base64 32)
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/notes.db
JWT_SECRET=$JWT_SECRET
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF
    print_success "Файл .env создан"
fi

# Удаление version из docker-compose.yml
print_info "Обновление docker-compose.yml..."
sed -i '/^version:/d' docker-compose.yml || true
print_success "docker-compose.yml обновлен"

# Шаг 7: Предварительная загрузка образа Node.js
print_header "Шаг 7: Предварительная загрузка образа Node.js"
print_info "Загрузка образа node:20-alpine..."
print_warning "Это может занять несколько минут при первом запуске..."

# Попытка загрузить образ с повторами
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker pull node:20-alpine; then
        print_success "Образ node:20-alpine загружен"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warning "Попытка $RETRY_COUNT из $MAX_RETRIES не удалась. Повтор через 10 секунд..."
            sleep 10
        else
            print_error "Не удалось загрузить образ после $MAX_RETRIES попыток. Проверьте подключение к интернету."
        fi
    fi
done

# Шаг 8: Запуск приложения
print_header "Шаг 8: Запуск приложения"
print_info "Сборка и запуск приложения..."
print_warning "Первая сборка может занять 5-10 минут..."

if docker-compose up -d --build; then
    print_success "Приложение запущено"
else
    print_error "Ошибка при запуске приложения"
fi

# Ожидание запуска
print_info "Ожидание запуска приложения..."
sleep 10

# Проверка статуса
print_header "Проверка статуса"
docker-compose ps

# Шаг 9: Опциональная установка Nginx
print_header "Шаг 9: Установка Nginx (опционально)"
read -p "Установить Nginx как reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Установка Nginx..."
    apt-get install -y nginx
    
    print_info "Настройка Nginx..."
    cat > /etc/nginx/sites-available/notes-service << 'NGINX_EOF'
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
NGINX_EOF

    ln -sf /etc/nginx/sites-available/notes-service /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t && systemctl restart nginx
    print_success "Nginx установлен и настроен"
else
    print_info "Nginx не установлен"
fi

# Финальное сообщение
print_header "✓ Установка завершена!"
echo ""
print_success "Notes Service успешно развернут!"
echo ""
print_info "Приложение доступно по адресу:"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}  http://$(hostname -I | awk '{print $1}')${NC}"
else
    echo -e "${GREEN}  http://$(hostname -I | awk '{print $1}'):3000${NC}"
fi
echo ""
print_info "Полезные команды:"
echo "  Просмотр логов:  docker-compose -f $INSTALL_DIR/docker-compose.yml logs -f app"
echo "  Статус:          docker-compose -f $INSTALL_DIR/docker-compose.yml ps"
echo "  Перезагрузка:    docker-compose -f $INSTALL_DIR/docker-compose.yml restart"
echo "  Остановка:       docker-compose -f $INSTALL_DIR/docker-compose.yml stop"
echo ""
print_info "Первый зарегистрированный пользователь станет администратором!"
echo ""
print_success "Готово! 🎉"

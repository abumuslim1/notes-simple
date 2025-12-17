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

print_header "Notes Service - Установка БЕЗ Docker"
print_info "Этот способ не требует Docker и Docker Hub"
echo ""

# Переменные
INSTALL_DIR="/opt/notes-service"
APP_PORT=3000

# Шаг 1: Обновление системы
print_header "Шаг 1: Обновление системы"
apt-get update -qq
apt-get upgrade -y -qq
print_success "Система обновлена"

# Шаг 2: Установка Node.js 20
print_header "Шаг 2: Установка Node.js 20"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js уже установлен: $NODE_VERSION"
    if [[ ! $NODE_VERSION =~ ^v20\. ]]; then
        print_warning "Требуется Node.js 20.x, текущая версия: $NODE_VERSION"
        print_info "Обновление Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
else
    print_info "Установка Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
print_success "Node.js установлен: $(node --version)"

# Шаг 3: Установка pnpm
print_header "Шаг 3: Установка pnpm"
if command -v pnpm &> /dev/null; then
    print_info "pnpm уже установлен: $(pnpm --version)"
else
    print_info "Установка pnpm..."
    npm install -g pnpm
fi
print_success "pnpm установлен: $(pnpm --version)"

# Шаг 4: Установка Git
print_header "Шаг 4: Установка Git"
if command -v git &> /dev/null; then
    print_info "Git уже установлен"
else
    print_info "Установка Git..."
    apt-get install -y git
fi
print_success "Git установлен"

# Шаг 5: Клонирование репозитория
print_header "Шаг 5: Клонирование репозитория"
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Директория $INSTALL_DIR уже существует"
    read -p "Удалить и клонировать заново? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Остановка сервиса если запущен
        if systemctl is-active --quiet notes-service; then
            print_info "Остановка сервиса..."
            systemctl stop notes-service
        fi
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

# Шаг 6: Установка зависимостей
print_header "Шаг 6: Установка зависимостей"
print_info "Установка зависимостей (это может занять несколько минут)..."
pnpm install
print_success "Зависимости установлены"

# Шаг 7: Создание конфигурации
print_header "Шаг 7: Создание конфигурации"
if [ -f ".env" ]; then
    print_warning "Файл .env уже существует, пропускаем создание"
else
    print_info "Создание файла .env..."
    JWT_SECRET=$(openssl rand -base64 32)
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./data/notes.db
JWT_SECRET=$JWT_SECRET
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF
    print_success "Файл .env создан"
fi

# Создание директории для БД
mkdir -p data
print_success "Директория для БД создана"

# Шаг 8: Сборка приложения
print_header "Шаг 8: Сборка приложения"
print_info "Сборка приложения (это может занять несколько минут)..."
pnpm build
print_success "Приложение собрано"

# Шаг 9: Создание systemd сервиса
print_header "Шаг 9: Создание systemd сервиса"
print_info "Создание systemd сервиса..."
cat > /etc/systemd/system/notes-service.service << 'EOF'
[Unit]
Description=Notes Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/notes-service
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /opt/notes-service/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
print_success "Systemd сервис создан"

# Шаг 10: Запуск сервиса
print_header "Шаг 10: Запуск сервиса"
print_info "Запуск сервиса..."
systemctl start notes-service
systemctl enable notes-service
sleep 5
print_success "Сервис запущен"

# Шаг 10.5: Создание администратора по умолчанию
print_header "Шаг 10.5: Создание администратора"
print_info "Создание администратора по умолчанию..."
sleep 3  # Ждем инициализации БД

if [ -f "create-admin.js" ]; then
    node create-admin.js || print_warning "Не удалось создать администратора автоматически"
else
    print_warning "Скрипт create-admin.js не найден"
    print_info "Создание администратора вручную..."
    
    # Создание администратора через Node.js
    node -e "
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
try {
  const db = new Database('./data/notes.db');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const userId = \`user_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
  const now = Date.now();
  db.prepare('INSERT INTO user (id, username, password, role, createdAt) VALUES (?, ?, ?, ?, ?)').run(userId, 'admin', hashedPassword, 'admin', now);
  console.log('✅ Администратор создан!');
  db.close();
} catch (e) {
  console.log('⚠️  Администратор уже существует или ошибка:', e.message);
}
" || print_warning "Не удалось создать администратора"
fi

print_success "Администратор создан: admin / admin123"

# Проверка статуса
if systemctl is-active --quiet notes-service; then
    print_success "Сервис работает"
else
    print_error "Сервис не запустился. Проверьте логи: journalctl -u notes-service -n 50"
fi

# Шаг 11: Опциональная установка Nginx
print_header "Шаг 11: Установка Nginx (опционально)"
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
print_success "Notes Service успешно развернут БЕЗ Docker!"
echo ""
print_info "Приложение доступно по адресу:"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}  http://$(hostname -I | awk '{print $1}')${NC}"
else
    echo -e "${GREEN}  http://$(hostname -I | awk '{print $1}'):3000${NC}"
fi
echo ""
print_info "Полезные команды:"
echo "  Просмотр логов:  sudo journalctl -u notes-service -f"
echo "  Статус:          sudo systemctl status notes-service"
echo "  Перезагрузка:    sudo systemctl restart notes-service"
echo "  Остановка:       sudo systemctl stop notes-service"
echo "  Запуск:          sudo systemctl start notes-service"
echo ""
print_info "Данные для входа:"
echo -e "${GREEN}  Логин:  admin${NC}"
echo -e "${GREEN}  Пароль: admin123${NC}"
echo ""
print_warning "Рекомендуется сменить пароль после первого входа!"
echo ""
print_success "Готово! 🎉"

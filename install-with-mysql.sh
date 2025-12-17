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

print_header "Notes Service - Установка с MySQL"
echo ""

# Переменные
INSTALL_DIR="/opt/notes-service"
APP_PORT=3000
DB_NAME="notes_service"
DB_USER="notes_user"
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

# Шаг 1: Обновление системы
print_header "Шаг 1: Обновление системы"
apt-get update -qq
apt-get upgrade -y -qq
print_success "Система обновлена"

# Шаг 2: Установка MySQL
print_header "Шаг 2: Установка MySQL"
if command -v mysql &> /dev/null; then
    print_info "MySQL уже установлен"
else
    print_info "Установка MySQL Server..."
    apt-get install -y mysql-server
    
    # Запуск MySQL
    systemctl start mysql
    systemctl enable mysql
    
    print_success "MySQL установлен и запущен"
fi

# Шаг 3: Настройка базы данных
print_header "Шаг 3: Настройка базы данных"
print_info "Создание базы данных и пользователя..."

# Проверяем существует ли база данных
if mysql -e "USE $DB_NAME" 2>/dev/null; then
    print_warning "База данных $DB_NAME уже существует"
    # Получаем существующий пароль из .env если есть
    if [ -f "$INSTALL_DIR/.env" ]; then
        EXISTING_URL=$(grep DATABASE_URL "$INSTALL_DIR/.env" 2>/dev/null | cut -d'=' -f2-)
        if [ -n "$EXISTING_URL" ]; then
            print_info "Используем существующие настройки БД"
        fi
    fi
else
    # Создаем базу данных и пользователя
    mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
    mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
    print_success "База данных создана"
    print_info "  Имя БД: $DB_NAME"
    print_info "  Пользователь: $DB_USER"
    print_info "  Пароль: $DB_PASS"
fi

# Шаг 4: Установка Node.js 20
print_header "Шаг 4: Установка Node.js 20"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js уже установлен: $NODE_VERSION"
    if [[ ! $NODE_VERSION =~ ^v20\. ]] && [[ ! $NODE_VERSION =~ ^v22\. ]]; then
        print_warning "Требуется Node.js 20+, текущая версия: $NODE_VERSION"
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

# Шаг 5: Установка pnpm
print_header "Шаг 5: Установка pnpm"
if command -v pnpm &> /dev/null; then
    print_info "pnpm уже установлен: $(pnpm --version)"
else
    print_info "Установка pnpm..."
    npm install -g pnpm
fi
print_success "pnpm установлен: $(pnpm --version)"

# Шаг 6: Установка Git
print_header "Шаг 6: Установка Git"
if command -v git &> /dev/null; then
    print_info "Git уже установлен"
else
    print_info "Установка Git..."
    apt-get install -y git
fi
print_success "Git установлен"

# Шаг 7: Клонирование репозитория
print_header "Шаг 7: Клонирование репозитория"
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

# Шаг 8: Установка зависимостей
print_header "Шаг 8: Установка зависимостей"
print_info "Установка зависимостей (это может занять несколько минут)..."
pnpm install
print_success "Зависимости установлены"

# Шаг 9: Создание конфигурации
print_header "Шаг 9: Создание конфигурации"
JWT_SECRET=$(openssl rand -base64 32)

# Определяем DATABASE_URL
if [ -f ".env" ] && grep -q "DATABASE_URL" .env; then
    print_warning "Файл .env уже существует с DATABASE_URL"
else
    print_info "Создание файла .env..."
    cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME
JWT_SECRET=$JWT_SECRET
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF
    print_success "Файл .env создан"
fi

# Шаг 10: Запуск миграций БД
print_header "Шаг 10: Создание таблиц в базе данных"
print_info "Запуск миграций..."

# Экспортируем DATABASE_URL для drizzle-kit
export DATABASE_URL="mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME"

# Запускаем миграции
pnpm db:push || {
    print_warning "Ошибка при запуске миграций, пробуем альтернативный способ..."
    npx drizzle-kit generate
    npx drizzle-kit migrate
}

print_success "Таблицы созданы"

# Шаг 11: Создание администратора
print_header "Шаг 11: Создание администратора"
print_info "Создание пользователя admin..."

# Создаем хеш пароля через Node.js и вставляем в БД
node -e "
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
  const connection = await mysql.createConnection('mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME');
  
  // Проверяем существует ли admin
  const [rows] = await connection.execute('SELECT id FROM users WHERE username = ?', ['admin']);
  
  if (rows.length > 0) {
    console.log('⚠️  Пользователь admin уже существует');
    await connection.end();
    return;
  }
  
  // Создаем хеш пароля
  const passwordHash = bcrypt.hashSync('admin123', 10);
  
  // Вставляем пользователя
  await connection.execute(
    'INSERT INTO users (username, passwordHash, name, role) VALUES (?, ?, ?, ?)',
    ['admin', passwordHash, 'Administrator', 'admin']
  );
  
  console.log('✅ Администратор создан!');
  await connection.end();
}

createAdmin().catch(e => {
  console.log('⚠️  Ошибка при создании администратора:', e.message);
  process.exit(0);
});
" || print_warning "Не удалось создать администратора автоматически"

print_success "Администратор: admin / admin123"

# Шаг 12: Сборка приложения
print_header "Шаг 12: Сборка приложения"
print_info "Сборка приложения (это может занять несколько минут)..."
pnpm build
print_success "Приложение собрано"

# Шаг 13: Создание systemd сервиса
print_header "Шаг 13: Создание systemd сервиса"
print_info "Создание systemd сервиса..."
cat > /etc/systemd/system/notes-service.service << EOF
[Unit]
Description=Notes Service
After=network.target mysql.service

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

# Шаг 14: Запуск сервиса
print_header "Шаг 14: Запуск сервиса"
print_info "Запуск сервиса..."
systemctl start notes-service
systemctl enable notes-service
sleep 5

# Проверка статуса
if systemctl is-active --quiet notes-service; then
    print_success "Сервис работает"
else
    print_error "Сервис не запустился. Проверьте логи: journalctl -u notes-service -n 50"
fi

# Шаг 15: Опциональная установка Nginx
print_header "Шаг 15: Установка Nginx (опционально)"
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
    NGINX_INSTALLED=true
else
    print_info "Nginx не установлен"
    NGINX_INSTALLED=false
fi

# Финальное сообщение
print_header "✓ Установка завершена!"
echo ""
print_success "Notes Service успешно развернут!"
echo ""
print_info "Приложение доступно по адресу:"
if [ "$NGINX_INSTALLED" = true ]; then
    echo -e "${GREEN}  http://$(hostname -I | awk '{print $1}')${NC}"
else
    echo -e "${GREEN}  http://$(hostname -I | awk '{print $1}'):3000${NC}"
fi
echo ""
print_info "Данные для входа:"
echo -e "${GREEN}  Логин:  admin${NC}"
echo -e "${GREEN}  Пароль: admin123${NC}"
echo ""
print_warning "Рекомендуется сменить пароль после первого входа!"
echo ""
print_info "Полезные команды:"
echo "  Просмотр логов:  sudo journalctl -u notes-service -f"
echo "  Статус:          sudo systemctl status notes-service"
echo "  Перезагрузка:    sudo systemctl restart notes-service"
echo "  Остановка:       sudo systemctl stop notes-service"
echo ""
print_info "Настройки базы данных:"
echo "  Хост:     localhost"
echo "  База:     $DB_NAME"
echo "  Пользователь: $DB_USER"
echo "  Пароль:   $DB_PASS"
echo ""
print_success "Готово! 🎉"

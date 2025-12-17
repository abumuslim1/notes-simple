# 🚀 Установка Notes Service БЕЗ Docker

Если у вас проблемы с Docker Hub rate limit, используйте этот способ установки напрямую на сервере.

## ✅ Преимущества

- ✅ Не требует Docker
- ✅ Не требует Docker Hub
- ✅ Быстрая установка (2-3 минуты)
- ✅ Работает на любом сервере с Node.js

## 📋 Требования

- Ubuntu 20.04+ / Debian 10+
- 1+ CPU, 2GB+ RAM
- Открытые порты: 22, 80, 3000

## 🚀 Установка

### Шаг 1: Установка Node.js 20

```bash
# Обновление системы
sudo apt-get update
sudo apt-get upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версии
node --version  # Должно быть v20.x.x
npm --version
```

### Шаг 2: Установка pnpm

```bash
# Установка pnpm глобально
npm install -g pnpm

# Проверка версии
pnpm --version
```

### Шаг 3: Клонирование репозитория

```bash
# Установка Git (если не установлен)
sudo apt-get install -y git

# Клонирование репозитория
cd /opt
sudo git clone -b release https://github.com/abumuslim1/notes-simple.git notes-service
cd notes-service

# Установка прав
sudo chown -R $USER:$USER /opt/notes-service
```

### Шаг 4: Установка зависимостей

```bash
cd /opt/notes-service

# Установка зависимостей
pnpm install
```

### Шаг 5: Создание конфигурации

```bash
# Генерация JWT секрета
JWT_SECRET=$(openssl rand -base64 32)

# Создание файла .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./data/notes.db
JWT_SECRET=$JWT_SECRET
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF

# Создание директории для БД
mkdir -p data
```

### Шаг 6: Сборка приложения

```bash
# Сборка клиента и сервера
pnpm build
```

### Шаг 7: Создание systemd сервиса

```bash
# Создание systemd сервиса
sudo cat > /etc/systemd/system/notes-service.service << 'EOF'
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

# Перезагрузка systemd
sudo systemctl daemon-reload

# Запуск сервиса
sudo systemctl start notes-service

# Автозапуск при загрузке
sudo systemctl enable notes-service

# Проверка статуса
sudo systemctl status notes-service
```

### Шаг 8: Установка Nginx (опционально)

```bash
# Установка Nginx
sudo apt-get install -y nginx

# Создание конфигурации
sudo cat > /etc/nginx/sites-available/notes-service << 'EOF'
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

# Активация конфигурации
sudo ln -sf /etc/nginx/sites-available/notes-service /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка и перезагрузка Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## ✅ Проверка

```bash
# Проверка статуса сервиса
sudo systemctl status notes-service

# Просмотр логов
sudo journalctl -u notes-service -f

# Проверка порта
netstat -tulpn | grep 3000

# Проверка в браузере
curl http://localhost:3000
```

## 🔧 Управление сервисом

```bash
# Просмотр логов
sudo journalctl -u notes-service -f

# Перезагрузка
sudo systemctl restart notes-service

# Остановка
sudo systemctl stop notes-service

# Запуск
sudo systemctl start notes-service

# Статус
sudo systemctl status notes-service
```

## 🔄 Обновление

```bash
# Остановка сервиса
sudo systemctl stop notes-service

# Получение обновлений
cd /opt/notes-service
git pull origin release

# Установка зависимостей
pnpm install

# Сборка
pnpm build

# Запуск сервиса
sudo systemctl start notes-service
```

## 💾 Резервная копия БД

```bash
# Создание резервной копии
cp /opt/notes-service/data/notes.db /opt/notes-service/data/notes.db.backup

# Скачивание на локальный компьютер
scp root@your-server-ip:/opt/notes-service/data/notes.db.backup ./
```

## 🔐 Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автоматическое обновление
sudo certbot renew --dry-run
```

## 🐛 Решение проблем

### Сервис не запускается

```bash
# Проверьте логи
sudo journalctl -u notes-service -n 50

# Проверьте файл .env
cat /opt/notes-service/.env

# Проверьте права на директорию
ls -la /opt/notes-service/data/
```

### Порт 3000 занят

```bash
# Найдите процесс
sudo netstat -tulpn | grep 3000

# Убейте процесс
sudo kill -9 <PID>

# Или измените порт в .env
```

### Ошибка БД

```bash
# Проверьте директорию
ls -la /opt/notes-service/data/

# Создайте директорию
mkdir -p /opt/notes-service/data
chmod 755 /opt/notes-service/data
```

## 📊 Мониторинг

```bash
# Использование памяти
ps aux | grep node

# Использование CPU
top -p $(pgrep -f notes-service)

# Размер БД
du -h /opt/notes-service/data/notes.db
```

## ✨ Готово!

Приложение доступно по адресу:
- **С Nginx:** `http://your-server-ip`
- **Без Nginx:** `http://your-server-ip:3000`

**Первый зарегистрированный пользователь станет администратором!**

## 📞 Поддержка

- GitHub Issues: https://github.com/abumuslim1/notes-simple/issues
- Документация: INSTALL_TIMEWEB.md

---

**Спасибо за использование Notes Service!** 💙

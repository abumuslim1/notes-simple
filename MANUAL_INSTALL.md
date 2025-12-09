# Пошаговая установка Notes Service на сервер

Выполняйте все команды по порядку. Если что-то не работает, остановитесь и сообщите об ошибке.

## Шаг 1: Обновление системы

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

## Шаг 2: Установка Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

## Шаг 3: Установка pnpm

```bash
sudo npm install -g pnpm
pnpm --version
```

## Шаг 4: Установка Git

```bash
sudo apt-get install -y git
git --version
```

## Шаг 5: Установка sqlite3

```bash
sudo apt-get install -y sqlite3
sqlite3 --version
```

## Шаг 6: Создание пользователя для сервиса

```bash
sudo useradd -r -s /bin/bash -d /opt/notes-service notes
```

## Шаг 7: Клонирование репозитория

```bash
sudo mkdir -p /opt/notes-service
sudo git clone -b release https://github.com/abumuslim1/notes-simple.git /opt/notes-service
cd /opt/notes-service
```

## Шаг 8: Проверка содержимого

```bash
ls -la /opt/notes-service
```

Должны быть файлы: `package.json`, `drizzle`, `server`, `client`, и т.д.

## Шаг 9: Создание файла .env

```bash
sudo tee /opt/notes-service/.env > /dev/null << 'EOF'
DATABASE_URL="file:./notes.db"
JWT_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
PORT=3000
VITE_APP_TITLE="Notes Service"
OWNER_NAME="Administrator"
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
```

Проверьте:
```bash
cat /opt/notes-service/.env
```

## Шаг 10: Установка зависимостей

```bash
cd /opt/notes-service
sudo -u notes pnpm install
```

Это займет несколько минут. Ждите завершения.

## Шаг 11: Инициализация базы данных

```bash
cd /opt/notes-service
sudo -u notes pnpm db:push
```

Проверьте, что БД создана:
```bash
ls -la /opt/notes-service/notes.db
```

## Шаг 12: Создание администратора в БД

```bash
cd /opt/notes-service

# Генерируем хеш пароля
ADMIN_PASSWORD_HASH=$(echo -n "admin" | sha256sum | cut -d' ' -f1)
NOW=$(date -u '+%Y-%m-%d %H:%M:%S')

# Создаем администратора
sudo sqlite3 notes.db << EOF
INSERT INTO users (username, passwordHash, name, role, createdAt, updatedAt, lastSignedIn)
VALUES ('admin', '$ADMIN_PASSWORD_HASH', 'Administrator', 'admin', '$NOW', '$NOW', '$NOW');
EOF
```

Проверьте:
```bash
sudo sqlite3 /opt/notes-service/notes.db "SELECT username, role FROM users;"
```

Должен вывести: `admin|admin`

## Шаг 13: Сборка приложения

```bash
cd /opt/notes-service
sudo -u notes pnpm build
```

Проверьте, что создана папка `dist`:
```bash
ls -la /opt/notes-service/dist/
```

## Шаг 14: Установка прав доступа

```bash
sudo chown -R notes:notes /opt/notes-service
sudo chmod -R 755 /opt/notes-service
sudo chmod 600 /opt/notes-service/.env
```

## Шаг 15: Создание systemd сервиса

```bash
sudo tee /etc/systemd/system/notes-service.service > /dev/null << 'EOF'
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
```

Перезагрузите systemd:
```bash
sudo systemctl daemon-reload
```

## Шаг 16: Запуск сервиса

```bash
sudo systemctl start notes-service
sudo systemctl enable notes-service
```

Проверьте статус:
```bash
sudo systemctl status notes-service
```

Должно быть: `Active: active (running)`

## Шаг 17: Проверка логов

```bash
sudo journalctl -u notes-service -f
```

Должно быть: `Server running on http://localhost:3000/`

Нажмите `Ctrl+C` чтобы выйти из логов.

## Шаг 18: Проверка приложения

```bash
curl http://localhost:3000/
```

Должен вернуть HTML код приложения.

## 🎉 Готово!

Приложение установлено и работает!

### Учетные данные администратора:
- **Логин**: `admin`
- **Пароль**: `admin`

### Откройте в браузере:
```
http://localhost:3000
```

### Управление сервисом:

```bash
# Статус
sudo systemctl status notes-service

# Логи
sudo journalctl -u notes-service -f

# Перезагрузка
sudo systemctl restart notes-service

# Остановка
sudo systemctl stop notes-service

# Запуск
sudo systemctl start notes-service
```

## Решение проблем

### Если сервис не запускается:

```bash
# Посмотрите логи
sudo journalctl -u notes-service -n 50 --no-pager

# Проверьте, что БД создана
ls -la /opt/notes-service/notes.db

# Проверьте права доступа
ls -la /opt/notes-service/.env

# Проверьте, что dist создана
ls -la /opt/notes-service/dist/
```

### Если порт 3000 занят:

```bash
# Найдите процесс
sudo lsof -i :3000

# Убейте процесс
sudo kill -9 <PID>

# Или измените порт в .env
sudo nano /opt/notes-service/.env
# Измените PORT=3000 на PORT=3001
# Сохраните: Ctrl+O, Enter, Ctrl+X

# Перезагрузите сервис
sudo systemctl restart notes-service
```

### Если ошибка при `pnpm install`:

```bash
# Очистите кеш
pnpm store prune

# Переустановите
pnpm install
```

### Если ошибка при `pnpm db:push`:

```bash
# Удалите старую БД
rm /opt/notes-service/notes.db

# Попробуйте снова
pnpm db:push
```

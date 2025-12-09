# Инструкция по развертыванию Notes Service

## Быстрый старт (автоматическая установка)

### 1. Скачайте и запустите скрипт установки

```bash
curl -fsSL https://raw.githubusercontent.com/abumuslim1/notes-simple/main/install.sh | bash
```

Скрипт автоматически:
- Установит зависимости (Node.js, npm/pnpm, MySQL)
- Клонирует репозиторий
- Настроит переменные окружения
- Создаст базу данных
- Запустит приложение

### 2. Откройте приложение

После завершения установки приложение будет доступно по адресу:
```
http://localhost:3000
```

---

## Ручная установка (пошагово)

### Требования

- **Node.js** 18+ (проверка: `node --version`)
- **npm** или **pnpm** (проверка: `npm --version` или `pnpm --version`)
- **MySQL** 8.0+ (проверка: `mysql --version`)
- **Git** (проверка: `git --version`)

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/abumuslim1/notes-simple.git
cd notes-simple
```

### Шаг 2: Установка зависимостей

```bash
pnpm install
# или если используете npm:
npm install
```

### Шаг 3: Создание базы данных

```bash
# Подключитесь к MySQL
mysql -u root -p

# Выполните команды в MySQL:
CREATE DATABASE notes_service;
CREATE USER 'notes_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON notes_service.* TO 'notes_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Шаг 4: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Database
DATABASE_URL="mysql://notes_user:your_secure_password@localhost:3306/notes_service"

# JWT Secret (генерируется автоматически)
JWT_SECRET="your_jwt_secret_here_min_32_chars"

# OAuth (если используется Manus OAuth, оставьте пустым для локального использования)
VITE_APP_ID="your_app_id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"

# App Configuration
VITE_APP_TITLE="Notes Service"
OWNER_NAME="Admin"
OWNER_OPEN_ID="admin_user_id"
```

### Шаг 5: Инициализация базы данных

```bash
pnpm db:push
```

### Шаг 6: Запуск приложения

#### Режим разработки:
```bash
pnpm dev
```

#### Режим продакшена:
```bash
pnpm build
pnpm start
```

Приложение будет доступно по адресу `http://localhost:3000`

---

## Развертывание на продакшене

### Использование Docker

Создайте файл `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Установка зависимостей
RUN npm install -g pnpm

# Копирование файлов проекта
COPY . .

# Установка зависимостей приложения
RUN pnpm install --frozen-lockfile

# Сборка приложения
RUN pnpm build

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["pnpm", "start"]
```

Запуск контейнера:
```bash
docker build -t notes-service .
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@db:3306/notes_service" \
  -e JWT_SECRET="your_jwt_secret" \
  notes-service
```

### Использование PM2 (для VPS)

```bash
# Установка PM2
npm install -g pm2

# Создание конфигурации ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'notes-service',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Сборка и запуск
pnpm build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Использование Nginx как reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Перезагрузка Nginx:
```bash
sudo systemctl restart nginx
```

---

## Переменные окружения

| Переменная | Описание | Обязательна |
|-----------|---------|-----------|
| `DATABASE_URL` | Строка подключения к MySQL | ✅ |
| `JWT_SECRET` | Секретный ключ для JWT (мин. 32 символа) | ✅ |
| `VITE_APP_TITLE` | Название приложения | ❌ |
| `VITE_APP_ID` | ID приложения OAuth | ❌ |
| `OAUTH_SERVER_URL` | URL OAuth сервера | ❌ |
| `VITE_OAUTH_PORTAL_URL` | URL портала OAuth | ❌ |
| `OWNER_NAME` | Имя владельца | ❌ |
| `OWNER_OPEN_ID` | OpenID владельца | ❌ |

---

## Важные замечания о безопасности

### Куки авторизации и HTTPS

**Проблема:** При локальном развертывании (HTTP) куки авторизации могут не сохраняться из-за флага `secure: true`.

**Решение:** В файле `server/_core/sdk.ts` флаг `secure` автоматически устанавливается в зависимости от переменной `NODE_ENV`:
- **Development (HTTP)**: `secure: false` - куки сохраняются на HTTP
- **Production (HTTPS)**: `secure: true` - куки сохраняются только на HTTPS

**Для production:** Убедитесь, что приложение работает через HTTPS (используйте Nginx с SSL сертификатом).

### Первый пользователь становится администратором

Первый зарегистрировавшийся пользователь автоматически получает роль администратора. Это позволяет избежать необходимости создания администратора вручную.

### Публичная регистрация

По умолчанию публичная регистрация отключена. Администратор может включить её в разделе "Настройки" → "Лицензия".

---

## Решение проблем

### Ошибка подключения к базе данных

```bash
# Проверьте, запущен ли MySQL
sudo systemctl status mysql

# Проверьте учетные данные в .env
# Убедитесь, что база данных создана:
mysql -u root -p -e "SHOW DATABASES;"
```

### Ошибка портов

```bash
# Если порт 3000 занят, используйте другой:
PORT=3001 pnpm dev

# Или найдите процесс, занимающий порт:
lsof -i :3000
kill -9 <PID>
```

### Проблема с авторизацией (пользователь перенаправляется на логин)

**Причина:** Куки авторизации не сохраняются из-за неправильного флага `secure`.

**Решение:**
1. Проверьте переменную `NODE_ENV` в файле `.env`
2. Для локального развертывания убедитесь, что используется HTTP (не HTTPS)
3. Проверьте, что флаг `secure` в `server/_core/sdk.ts` соответствует типу подключения
4. Очистите куки браузера и попробуйте снова

```bash
# Проверка переменной окружения
grep NODE_ENV /opt/notes-service/.env

# Проверка флага secure в sdk.ts
grep -A 5 "setAuthCookie" /opt/notes-service/server/_core/sdk.ts
```

### Ошибки при сборке

```bash
# Очистите кеш и переустановите зависимости
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## Резервное копирование

### Резервная копия базы данных

```bash
# Создание резервной копии
mysqldump -u notes_user -p notes_service > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из резервной копии
mysql -u notes_user -p notes_service < backup_file.sql
```

### Резервная копия файлов

```bash
# Если используется локальное хранилище
tar -czf notes_service_backup_$(date +%Y%m%d_%H%M%S).tar.gz /path/to/notes_service
```

---

## Обновление приложения

```bash
# Получите последние изменения
git pull origin release

# Установите новые зависимости
pnpm install

# Примените миграции базы данных
pnpm db:push

# Пересоберите приложение
pnpm build

# Перезагрузите приложение (для systemd)
sudo systemctl restart notes-service

# Или для PM2:
pm2 restart notes-service
```

---

## Поддержка

Если у вас возникли проблемы:

1. Проверьте логи приложения
2. Убедитесь, что все зависимости установлены
3. Проверьте переменные окружения в файле `.env`
4. Создайте issue на GitHub: https://github.com/abumuslim1/notes-simple/issues

---

## Лицензия

MIT

# Развертывание Notes Service на Timeweb Cloud

Полное руководство по установке Notes Service на облачном сервере Timeweb Cloud с использованием Docker.

## 📋 Требования

- Аккаунт на [Timeweb Cloud](https://timeweb.cloud)
- Минимальная конфигурация: 1 CPU, 2GB RAM, 20GB SSD
- SSH доступ к серверу
- Установленные Docker и Docker Compose

## 🚀 Быстрый старт (5 минут)

### Шаг 1: Подготовка сервера

Подключитесь к серверу по SSH:
```bash
ssh root@your-server-ip
```

Обновите систему:
```bash
apt-get update && apt-get upgrade -y
```

### Шаг 2: Установка Docker и Docker Compose

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

### Шаг 3: Клонирование и развертывание приложения

```bash
# Перейдите в директорию для приложений
cd /opt

# Клонируйте репозиторий
git clone -b release https://github.com/abumuslim1/notes-simple.git notes-service
cd notes-service

# Создайте файл .env с переменными окружения
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/notes.db
JWT_SECRET=$(openssl rand -base64 32)
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF

# Запустите приложение с Docker Compose
docker-compose up -d

# Проверьте статус
docker-compose ps
```

### Шаг 4: Проверка работы

```bash
# Проверьте логи
docker-compose logs -f app

# Откройте приложение в браузере
# http://your-server-ip:3000
```

## 🔧 Настройка Nginx как reverse proxy

Для использования стандартного порта 80/443 установите Nginx:

```bash
# Установка Nginx
apt-get install -y nginx

# Создание конфигурации
sudo tee /etc/nginx/sites-available/notes-service > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Перенаправление на HTTPS (опционально)
    # return 301 https://$server_name$request_uri;

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
sudo ln -s /etc/nginx/sites-available/notes-service /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl restart nginx
```

## 🔐 SSL сертификат (Let's Encrypt)

```bash
# Установка Certbot
apt-get install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot certonly --nginx -d your-domain.com

# Обновление конфигурации Nginx для HTTPS
sudo tee /etc/nginx/sites-available/notes-service > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

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

# Перезагрузка Nginx
sudo systemctl restart nginx
```

## 📊 Управление приложением

### Просмотр логов
```bash
# Логи приложения
docker-compose logs -f app

# Последние 100 строк
docker-compose logs --tail=100 app

# Логи конкретного сервиса
docker-compose logs app
```

### Остановка/перезагрузка
```bash
# Остановка
docker-compose stop

# Запуск
docker-compose start

# Перезагрузка
docker-compose restart

# Полная пересборка
docker-compose down
docker-compose up -d --build
```

### Резервная копия БД
```bash
# Создание резервной копии
docker-compose exec app cp /app/data/notes.db /app/data/notes.db.backup

# Скачивание на локальный компьютер
scp root@your-server-ip:/opt/notes-service/data/notes.db ./notes.db.backup
```

### Восстановление БД
```bash
# Загрузка резервной копии на сервер
scp ./notes.db.backup root@your-server-ip:/opt/notes-service/data/

# Восстановление
docker-compose exec app cp /app/data/notes.db.backup /app/data/notes.db

# Перезагрузка приложения
docker-compose restart app
```

## 🔄 Обновление приложения

```bash
cd /opt/notes-service

# Получение последних изменений
git pull origin release

# Пересборка Docker образа
docker-compose down
docker-compose up -d --build

# Проверка статуса
docker-compose ps
```

## 📝 Переменные окружения

Отредактируйте файл `.env` для настройки приложения:

```bash
# Основные переменные
NODE_ENV=production              # Режим работы (production/development)
PORT=3000                        # Порт приложения
DATABASE_URL=file:/app/data/notes.db  # Путь к БД (SQLite)

# Безопасность
JWT_SECRET=your-secret-key       # Секретный ключ для JWT (минимум 32 символа)

# Приложение
VITE_APP_TITLE=Notes Service     # Название приложения
OWNER_NAME=Administrator         # Имя владельца

# OAuth (опционально)
VITE_APP_ID=                     # ID приложения OAuth
OAUTH_SERVER_URL=                # URL OAuth сервера
VITE_OAUTH_PORTAL_URL=           # URL портала OAuth
OWNER_OPEN_ID=                   # OpenID владельца
```

## 🐛 Решение проблем

### Приложение не запускается
```bash
# Проверьте логи
docker-compose logs app

# Проверьте, не занят ли порт 3000
netstat -tulpn | grep 3000

# Перезагрузите контейнер
docker-compose restart app
```

### Ошибка подключения к БД
```bash
# Проверьте, существует ли директория data
ls -la /opt/notes-service/data/

# Создайте директорию если её нет
mkdir -p /opt/notes-service/data

# Проверьте права доступа
chmod 755 /opt/notes-service/data
```

### Высокое использование памяти
```bash
# Проверьте использование ресурсов
docker stats

# Ограничьте ресурсы в docker-compose.yml:
# deploy:
#   resources:
#     limits:
#       cpus: '1'
#       memory: 1G
```

## 📈 Мониторинг

### Проверка здоровья приложения
```bash
# Проверка через curl
curl -s http://localhost:3000 | head -20

# Проверка статуса контейнера
docker-compose ps
```

### Автоматическая перезагрузка при сбое
Docker Compose уже настроен на автоматическую перезагрузку:
```yaml
restart: unless-stopped
```

## 🔐 Безопасность

### Рекомендации для production

1. **Измените JWT_SECRET**
   ```bash
   # Генерируйте новый секретный ключ
   openssl rand -base64 32
   ```

2. **Используйте HTTPS**
   - Установите SSL сертификат (Let's Encrypt)
   - Перенаправляйте HTTP на HTTPS

3. **Ограничьте доступ к SSH**
   - Используйте ключи вместо пароля
   - Измените стандартный порт SSH

4. **Регулярные резервные копии**
   ```bash
   # Создайте cron задачу для ежедневной резервной копии
   0 2 * * * docker-compose -f /opt/notes-service/docker-compose.yml exec app cp /app/data/notes.db /app/data/notes.db.$(date +\%Y\%m\%d)
   ```

5. **Отключите публичную регистрацию**
   - По умолчанию публичная регистрация отключена
   - Администратор может включить её в настройках

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи приложения
2. Убедитесь, что Docker и Docker Compose установлены
3. Проверьте переменные окружения в файле `.env`
4. Создайте issue на GitHub: https://github.com/abumuslim1/notes-simple/issues

## 📚 Дополнительные ресурсы

- [Документация Docker](https://docs.docker.com/)
- [Документация Timeweb Cloud](https://docs.timeweb.cloud/)
- [Nginx документация](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

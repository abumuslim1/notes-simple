# 📦 Установка Notes Service на Timeweb Cloud

Полное руководство по установке и настройке Notes Service на облачном сервере Timeweb Cloud.

## 🎯 Что вы получите

✅ Полностью функциональное приложение для управления заметками и задачами  
✅ Встроенную базу данных SQLite (не требует отдельной установки)  
✅ Защищенную авторизацию с JWT токенами  
✅ Систему ролей (администратор/пользователь)  
✅ Резервное копирование данных  
✅ SSL сертификат (Let's Encrypt)  

## 📋 Требования

- **Сервер:** Timeweb Cloud (Ubuntu 20.04+ или Debian 10+)
- **Ресурсы:** Минимум 1 CPU, 2GB RAM, 20GB SSD
- **Сеть:** Открытые порты 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **Доменное имя:** (опционально, но рекомендуется для production)

## 🚀 Установка (выберите один способ)

### Способ 1: Автоматическая установка (Рекомендуется) ⭐

**Самый быстрый способ - всё делает скрипт!**

```bash
# 1. Подключитесь к серверу
ssh root@your-server-ip

# 2. Скачайте скрипт развертывания
curl -O https://raw.githubusercontent.com/abumuslim1/notes-simple/release/deploy-timeweb.sh
chmod +x deploy-timeweb.sh

# 3. Запустите скрипт
sudo ./deploy-timeweb.sh

# 4. Следуйте инструкциям (скрипт спросит про Nginx)
```

**Время установки:** ~5 минут  
**Что делает скрипт:**
- Обновляет систему
- Устанавливает Docker и Docker Compose
- Клонирует репозиторий
- Создает конфигурацию
- Запускает приложение
- Опционально устанавливает Nginx

### Способ 2: Ручная установка

Если вы предпочитаете контролировать каждый шаг:

```bash
# 1. Обновление системы
apt-get update && apt-get upgrade -y

# 2. Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Установка Git
apt-get install -y git

# 5. Клонирование репозитория
cd /opt
git clone -b release https://github.com/abumuslim1/notes-simple.git notes-service
cd notes-service

# 6. Создание конфигурации
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=file:/app/data/notes.db
JWT_SECRET=$(openssl rand -base64 32)
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF

# 7. Запуск приложения
docker-compose up -d

# 8. Проверка статуса
docker-compose ps
```

## 🌐 Доступ к приложению

### Без Nginx (прямой доступ)

```
http://your-server-ip:3000
```

### С Nginx (рекомендуется)

```
http://your-domain.com
https://your-domain.com (с SSL)
```

## 🔐 Первый вход

1. Откройте приложение в браузере
2. Нажмите "Зарегистрироваться"
3. Введите любые логин и пароль
4. **Первый пользователь автоматически становится администратором!**
5. Вы в системе 🎉

## 🔒 Настройка SSL (HTTPS)

### Установка Let's Encrypt сертификата

```bash
# Установка Certbot
apt-get install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot certonly --nginx -d your-domain.com

# Сертификат будет в: /etc/letsencrypt/live/your-domain.com/
```

### Обновление Nginx конфигурации

```bash
sudo nano /etc/nginx/sites-available/notes-service
```

Замените содержимое на:

```nginx
# Перенаправление HTTP на HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL параметры безопасности
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Проксирование на приложение
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
```

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl restart nginx
```

## 💾 Резервная копия базы данных

### Создание резервной копии

```bash
# Создание резервной копии
docker-compose -f /opt/notes-service/docker-compose.yml exec app \
  cp /app/data/notes.db /app/data/notes.db.backup

# Скачивание на локальный компьютер
scp root@your-server-ip:/opt/notes-service/data/notes.db.backup ./
```

### Восстановление из резервной копии

```bash
# Загрузка резервной копии на сервер
scp ./notes.db.backup root@your-server-ip:/opt/notes-service/data/

# Восстановление
docker-compose -f /opt/notes-service/docker-compose.yml exec app \
  cp /app/data/notes.db.backup /app/data/notes.db

# Перезагрузка приложения
docker-compose -f /opt/notes-service/docker-compose.yml restart app
```

### Автоматическое резервное копирование

Добавьте в crontab:

```bash
# Редактирование crontab
crontab -e

# Добавьте строку (резервная копия каждый день в 2:00 ночи)
0 2 * * * docker-compose -f /opt/notes-service/docker-compose.yml exec app cp /app/data/notes.db /app/data/notes.db.$(date +\%Y\%m\%d)
```

## 📊 Управление приложением

### Просмотр логов

```bash
# Логи в реальном времени
docker-compose -f /opt/notes-service/docker-compose.yml logs -f app

# Последние 100 строк
docker-compose -f /opt/notes-service/docker-compose.yml logs --tail=100 app
```

### Проверка статуса

```bash
# Статус контейнеров
docker-compose -f /opt/notes-service/docker-compose.yml ps

# Использование ресурсов
docker stats
```

### Управление сервисом

```bash
# Перезагрузка приложения
docker-compose -f /opt/notes-service/docker-compose.yml restart

# Остановка
docker-compose -f /opt/notes-service/docker-compose.yml stop

# Запуск
docker-compose -f /opt/notes-service/docker-compose.yml start

# Полная пересборка
docker-compose -f /opt/notes-service/docker-compose.yml down
docker-compose -f /opt/notes-service/docker-compose.yml up -d --build
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

## 🔐 Безопасность - Чек-лист

- [ ] Измените JWT_SECRET в файле `/opt/notes-service/.env`
- [ ] Установите SSL сертификат (Let's Encrypt)
- [ ] Настройте доменное имя в Nginx
- [ ] Отключите публичную регистрацию (если не нужна)
- [ ] Создавайте регулярные резервные копии
- [ ] Обновляйте приложение регулярно
- [ ] Используйте сильные пароли для администратора

## 🐛 Решение проблем

### Приложение не запускается

```bash
# Проверьте логи
docker-compose -f /opt/notes-service/docker-compose.yml logs app

# Перезагрузите контейнер
docker-compose -f /opt/notes-service/docker-compose.yml restart app
```

### Ошибка подключения к БД

```bash
# Проверьте директорию данных
ls -la /opt/notes-service/data/

# Создайте директорию если её нет
mkdir -p /opt/notes-service/data
chmod 755 /opt/notes-service/data
```

### Порт 3000 занят

```bash
# Найдите процесс, занимающий порт
netstat -tulpn | grep 3000

# Убейте процесс (если нужно)
kill -9 <PID>

# Или измените порт в docker-compose.yml
```

### Высокое использование памяти

```bash
# Проверьте использование ресурсов
docker stats

# Очистите неиспользуемые образы
docker system prune -a
```

## 📞 Поддержка

- **GitHub Issues:** https://github.com/abumuslim1/notes-simple/issues
- **Документация:** `/opt/notes-service/TIMEWEB_DEPLOYMENT.md`
- **Быстрый старт:** `/opt/notes-service/QUICK_START.md`

## 📚 Дополнительные ресурсы

- [Документация Docker](https://docs.docker.com/)
- [Документация Timeweb Cloud](https://docs.timeweb.cloud/)
- [Nginx документация](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot](https://certbot.eff.org/)

## ✨ Готово!

Поздравляем! 🎉 Ваш Notes Service установлен и работает на Timeweb Cloud.

Теперь вы можете:
- 📝 Создавать и управлять заметками
- ✅ Управлять задачами
- 👥 Приглашать других пользователей
- 🔐 Использовать защищенную авторизацию
- 📊 Отслеживать статус задач

**Спасибо за использование Notes Service!** 💙

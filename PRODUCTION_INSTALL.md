# Notes Service - Production Installation Guide

Полное руководство по установке Notes Service на production сервер с MySQL.

## 📋 Содержание

- [Требования](#требования)
- [Быстрая установка](#быстрая-установка)
- [Ручная установка](#ручная-установка)
- [Решение проблем](#решение-проблем)
- [Настройка HTTPS](#настройка-https)
- [Обслуживание](#обслуживание)

---

## 🎯 Требования

### Минимальные требования

| Компонент | Требование |
|-----------|------------|
| ОС | Ubuntu 20.04+ / Debian 10+ |
| CPU | 1+ ядро |
| RAM | 2GB+ |
| Диск | 20GB+ SSD |
| Порты | 22 (SSH), 80 (HTTP), 443 (HTTPS) |

### Программное обеспечение

Скрипт автоматически установит:
- MySQL Server 8.0+
- Node.js 20.x
- pnpm (package manager)
- Git
- Nginx (опционально)

---

## 🚀 Быстрая установка

### Шаг 1: Подключитесь к серверу

```bash
ssh root@your-server-ip
```

### Шаг 2: Скачайте и запустите скрипт

```bash
# Скачайте скрипт установки
curl -O https://raw.githubusercontent.com/abumuslim1/notes-simple/release/install-with-mysql.sh

# Сделайте его исполняемым
chmod +x install-with-mysql.sh

# Запустите установку
sudo ./install-with-mysql.sh
```

### Шаг 3: Следуйте инструкциям

Скрипт выполнит следующие действия:
1. ✅ Обновит систему
2. ✅ Установит MySQL Server
3. ✅ Создаст базу данных `notes_service`
4. ✅ Установит Node.js 20 и pnpm
5. ✅ Клонирует репозиторий
6. ✅ Установит зависимости
7. ✅ Создаст таблицы в БД
8. ✅ Создаст администратора `admin/admin123`
9. ✅ Соберет приложение
10. ✅ Создаст systemd сервис
11. ✅ Спросит об установке Nginx

**Время установки:** 5-10 минут

### Шаг 4: Откройте приложение

После установки приложение будет доступно:
- **С Nginx:** `http://your-server-ip`
- **Без Nginx:** `http://your-server-ip:3000`

**Данные для входа:**
- Логин: `admin`
- Пароль: `admin123`

⚠️ **ВАЖНО:** Смените пароль после первого входа!

---

## 🔧 Ручная установка

Если автоматический скрипт не подходит, выполните установку вручную:

### 1. Обновите систему

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Установите MySQL

```bash
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 3. Создайте базу данных

```bash
sudo mysql << EOF
CREATE DATABASE notes_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'notes_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON notes_service.* TO 'notes_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 4. Установите Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
```

### 5. Установите pnpm

```bash
sudo npm install -g pnpm
```

### 6. Клонируйте репозиторий

```bash
cd /opt
sudo git clone -b release https://github.com/abumuslim1/notes-simple.git notes-service
cd notes-service
```

### 7. Создайте .env файл

```bash
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://notes_user:your_password@localhost:3306/notes_service
JWT_SECRET=$(openssl rand -base64 32)
VITE_APP_TITLE=Notes Service
OWNER_NAME=Administrator
EOF
```

### 8. Установите зависимости

```bash
pnpm install
```

### 9. Создайте таблицы в БД

```bash
npx drizzle-kit push --force
```

### 10. Создайте администратора

```bash
node << 'EOF'
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
  require('dotenv').config();
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const passwordHash = bcrypt.hashSync('admin123', 10);
  await connection.execute(
    'INSERT INTO users (username, passwordHash, name, role) VALUES (?, ?, ?, ?)',
    ['admin', passwordHash, 'Administrator', 'admin']
  );
  console.log('✅ Администратор создан!');
  await connection.end();
}
createAdmin();
EOF
```

### 11. Соберите приложение

```bash
pnpm build
```

### 12. Создайте systemd сервис

```bash
sudo cat > /etc/systemd/system/notes-service.service << EOF
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

sudo systemctl daemon-reload
sudo systemctl start notes-service
sudo systemctl enable notes-service
```

### 13. Проверьте статус

```bash
sudo systemctl status notes-service
```

---

## 🔍 Решение проблем

### Проблема: Сервис не запускается

**Проверьте логи:**
```bash
sudo journalctl -u notes-service -n 50
```

**Частые причины:**
1. Файл `dist/index.js` не существует → Запустите `pnpm build`
2. MySQL не запущен → `sudo systemctl start mysql`
3. Неверный DATABASE_URL → Проверьте `.env` файл

### Проблема: 502 Bad Gateway (Nginx)

**Причина:** Приложение не отвечает на порту 3000

**Решение:**
```bash
# Проверьте статус
sudo systemctl status notes-service

# Перезапустите сервис
sudo systemctl restart notes-service

# Проверьте порт
netstat -tulpn | grep 3000
```

### Проблема: Авторизация не работает (куки не сохраняются)

**Причина:** Флаг `secure: true` в куках при HTTP

**Решение:** Уже исправлено в `server/_core/sdk.ts` (secure: false)

Если проблема осталась:
```bash
cd /opt/notes-service
# Проверьте файл
cat server/_core/sdk.ts | grep "secure:"
# Должно быть: secure: false

# Если нет, пересоберите
pnpm build
sudo systemctl restart notes-service
```

### Проблема: Таблицы не создаются

**Решение:**
```bash
cd /opt/notes-service
export DATABASE_URL="mysql://notes_user:password@localhost:3306/notes_service"
npx drizzle-kit push --force
```

### Проблема: Ошибка "Cannot find module"

**Решение:**
```bash
cd /opt/notes-service
pnpm install
pnpm build
sudo systemctl restart notes-service
```

---

## 🔒 Настройка HTTPS

### С Let's Encrypt (Рекомендуется)

```bash
# Установите Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получите сертификат (замените your-domain.com)
sudo certbot --nginx -d your-domain.com

# Certbot автоматически настроит Nginx для HTTPS
```

### После получения SSL сертификата

Обновите `server/_core/sdk.ts`:
```typescript
secure: true, // Теперь можно включить для HTTPS
```

Пересоберите:
```bash
cd /opt/notes-service
pnpm build
sudo systemctl restart notes-service
```

---

## 🛠 Обслуживание

### Просмотр логов

```bash
# Последние 50 строк
sudo journalctl -u notes-service -n 50

# В реальном времени
sudo journalctl -u notes-service -f
```

### Управление сервисом

```bash
# Статус
sudo systemctl status notes-service

# Запуск
sudo systemctl start notes-service

# Остановка
sudo systemctl stop notes-service

# Перезагрузка
sudo systemctl restart notes-service

# Автозапуск
sudo systemctl enable notes-service
```

### Резервное копирование БД

```bash
# Создать бэкап
mysqldump -u notes_user -p notes_service > backup_$(date +%Y%m%d).sql

# Восстановить из бэкапа
mysql -u notes_user -p notes_service < backup_20231217.sql
```

### Обновление приложения

```bash
cd /opt/notes-service

# Остановите сервис
sudo systemctl stop notes-service

# Обновите код
git pull origin release

# Установите зависимости
pnpm install

# Примените миграции
npx drizzle-kit push --force

# Соберите
pnpm build

# Запустите
sudo systemctl start notes-service
```

### Мониторинг

```bash
# Использование ресурсов
htop

# Использование диска
df -h

# Размер БД
sudo du -sh /var/lib/mysql/notes_service
```

---

## 📊 Производительность

### Рекомендации для production

1. **Включите gzip в Nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

2. **Настройте кэширование:**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **Увеличьте лимиты MySQL:**
```sql
SET GLOBAL max_connections = 200;
SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
```

4. **Настройте логротate:**
```bash
sudo cat > /etc/logrotate.d/notes-service << EOF
/var/log/notes-service/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF
```

---

## 🔐 Безопасность

### Чек-лист безопасности

- [ ] Сменить пароль администратора
- [ ] Настроить HTTPS с Let's Encrypt
- [ ] Включить `secure: true` в куках после HTTPS
- [ ] Настроить firewall (ufw)
- [ ] Регулярно обновлять систему
- [ ] Настроить резервное копирование БД
- [ ] Ограничить доступ к MySQL (только localhost)
- [ ] Использовать сложные пароли для БД

### Настройка Firewall

```bash
# Установите ufw
sudo apt-get install -y ufw

# Разрешите SSH
sudo ufw allow 22/tcp

# Разрешите HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Включите firewall
sudo ufw enable
```

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи: `sudo journalctl -u notes-service -n 100`
2. Проверьте статус: `sudo systemctl status notes-service`
3. Проверьте MySQL: `sudo systemctl status mysql`
4. Создайте issue на GitHub: https://github.com/abumuslim1/notes-simple/issues

---

## 📝 Примечания

- Приложение работает на HTTP по умолчанию (без SSL)
- Для production **настоятельно рекомендуется** настроить HTTPS
- Максимальный размер загружаемого файла: 50MB
- База данных использует кодировку utf8mb4 (поддержка emoji)
- Сессии хранятся в JWT токенах (30 дней)

---

**Готово! Ваш Notes Service развернут и готов к работе!** 🎉

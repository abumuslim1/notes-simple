# ⚡ Быстрый старт Notes Service на Timeweb Cloud

## 🚀 За 5 минут до запуска

### Шаг 1: Подготовка (на локальном компьютере)

```bash
# Скачайте скрипт развертывания
curl -O https://raw.githubusercontent.com/abumuslim1/notes-simple/release/deploy-timeweb.sh
chmod +x deploy-timeweb.sh
```

### Шаг 2: Развертывание (на сервере Timeweb)

```bash
# Подключитесь к серверу
ssh root@your-server-ip

# Скачайте и запустите скрипт
curl -O https://raw.githubusercontent.com/abumuslim1/notes-simple/release/deploy-timeweb.sh
chmod +x deploy-timeweb.sh
sudo ./deploy-timeweb.sh
```

### Шаг 3: Следуйте инструкциям

Скрипт спросит, нужно ли установить Nginx (рекомендуется).

### Шаг 4: Откройте приложение

```
http://your-server-ip:3000
```

## 📝 Первый вход

1. **Зарегистрируйте первого пользователя** (он станет администратором)
2. **Логин и пароль:** Используйте любые значения
3. **Готово!** Вы в системе

## 🔧 Основные команды

```bash
# Просмотр логов
docker-compose -f /opt/notes-service/docker-compose.yml logs -f app

# Статус приложения
docker-compose -f /opt/notes-service/docker-compose.yml ps

# Перезагрузка
docker-compose -f /opt/notes-service/docker-compose.yml restart

# Остановка
docker-compose -f /opt/notes-service/docker-compose.yml stop

# Запуск
docker-compose -f /opt/notes-service/docker-compose.yml start
```

## 🔐 Важно для production

1. **Измените JWT_SECRET** в файле `/opt/notes-service/.env`
2. **Установите SSL сертификат** (Let's Encrypt)
3. **Настройте доменное имя** в Nginx
4. **Создавайте резервные копии** БД

## 📚 Подробная документация

- `README_TIMEWEB.md` - Полное руководство
- `TIMEWEB_DEPLOYMENT.md` - Детальные инструкции
- `BUGFIXES.md` - Описание исправлений

## 💡 Советы

### Резервная копия БД

```bash
docker-compose -f /opt/notes-service/docker-compose.yml exec app \
  cp /app/data/notes.db /app/data/notes.db.backup
```

### Просмотр переменных окружения

```bash
cat /opt/notes-service/.env
```

### Обновление приложения

```bash
cd /opt/notes-service
git pull origin release
docker-compose down
docker-compose up -d --build
```

## ❓ Если что-то не работает

1. **Проверьте логи:** `docker-compose logs app`
2. **Проверьте статус:** `docker-compose ps`
3. **Перезагрузитесь:** `docker-compose restart`
4. **Проверьте порты:** `netstat -tulpn | grep 3000`

## 📞 Нужна помощь?

- GitHub Issues: https://github.com/abumuslim1/notes-simple/issues
- Документация: `/opt/notes-service/TIMEWEB_DEPLOYMENT.md`

---

**Готово!** Ваш Notes Service работает на Timeweb Cloud 🎉

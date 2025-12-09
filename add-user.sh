#!/bin/bash

# Скрипт для добавления пользователя в Notes Service

set -e

if [ $# -lt 3 ]; then
    echo "Использование: $0 <username> <password> <name> [role]"
    echo ""
    echo "Пример:"
    echo "  $0 admin password123 'Administrator' admin"
    echo "  $0 user password123 'John Doe' user"
    exit 1
fi

USERNAME=$1
PASSWORD=$2
NAME=$3
ROLE=${4:-admin}  # По умолчанию админ

# Определяем путь к БД
if [ -f ".env" ]; then
    DB_PATH=$(grep "DATABASE_URL" .env | sed 's/DATABASE_URL="file:\(.*\)"/\1/')
else
    DB_PATH="./notes.db"
fi

# Если путь относительный, делаем его абсолютным
if [[ ! "$DB_PATH" = /* ]]; then
    DB_PATH="$(pwd)/$DB_PATH"
fi

echo "📝 Создание пользователя: $USERNAME"
echo "📋 Роль: $ROLE"
echo "👤 Имя: $NAME"
echo "📦 База данных: $DB_PATH"
echo ""

# Проверяем, существует ли БД
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Ошибка: База данных не найдена: $DB_PATH"
    exit 1
fi

# Генерируем хеш пароля (простой SHA256)
PASSWORD_HASH=$(echo -n "$PASSWORD" | sha256sum | cut -d' ' -f1)

# Проверяем, существует ли пользователь
EXISTING=$(sqlite3 "$DB_PATH" "SELECT id FROM users WHERE username = '$USERNAME';" 2>/dev/null || echo "")

if [ ! -z "$EXISTING" ]; then
    echo "❌ Ошибка: Пользователь '$USERNAME' уже существует"
    exit 1
fi

# Добавляем пользователя
NOW=$(date -u '+%Y-%m-%d %H:%M:%S')

sqlite3 "$DB_PATH" << EOF
INSERT INTO users (username, passwordHash, name, role, createdAt, updatedAt, lastSignedIn)
VALUES ('$USERNAME', '$PASSWORD_HASH', '$NAME', '$ROLE', '$NOW', '$NOW', '$NOW');
EOF

if [ $? -eq 0 ]; then
    echo "✅ Пользователь успешно создан!"
    echo "👤 Логин: $USERNAME"
    echo "🔐 Пароль: $PASSWORD"
    echo ""
    echo "Вы можете войти в приложение с этими учетными данными."
else
    echo "❌ Ошибка при создании пользователя"
    exit 1
fi

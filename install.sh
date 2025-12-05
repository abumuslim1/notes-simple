#!/bin/bash

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Проверка прав администратора
check_sudo() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Этот скрипт должен быть запущен с правами администратора (sudo)"
        exit 1
    fi
}

# Проверка ОС
check_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if [ -f /etc/debian_version ]; then
            DISTRO="debian"
        elif [ -f /etc/redhat-release ]; then
            DISTRO="redhat"
        else
            DISTRO="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Неподдерживаемая операционная система: $OSTYPE"
        exit 1
    fi
}

# Установка Node.js
install_nodejs() {
    print_header "Проверка Node.js"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js уже установлен: $NODE_VERSION"
    else
        print_info "Установка Node.js..."
        
        if [ "$OS" = "linux" ] && [ "$DISTRO" = "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            apt-get install -y nodejs
        elif [ "$OS" = "linux" ] && [ "$DISTRO" = "redhat" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            yum install -y nodejs
        elif [ "$OS" = "macos" ]; then
            brew install node
        fi
        
        print_success "Node.js установлен: $(node --version)"
    fi
}

# Установка pnpm
install_pnpm() {
    print_header "Проверка pnpm"
    
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm уже установлен: $PNPM_VERSION"
    else
        print_info "Установка pnpm..."
        npm install -g pnpm
        print_success "pnpm установлен: $(pnpm --version)"
    fi
}

# Установка MySQL
install_mysql() {
    print_header "Проверка MySQL"
    
    if command -v mysql &> /dev/null; then
        MYSQL_VERSION=$(mysql --version)
        print_success "MySQL уже установлен: $MYSQL_VERSION"
    else
        print_info "Установка MySQL..."
        
        if [ "$OS" = "linux" ] && [ "$DISTRO" = "debian" ]; then
            apt-get update
            apt-get install -y mysql-server
        elif [ "$OS" = "linux" ] && [ "$DISTRO" = "redhat" ]; then
            yum install -y mysql-server
        elif [ "$OS" = "macos" ]; then
            brew install mysql
        fi
        
        print_success "MySQL установлен"
        
        # Запуск MySQL
        if [ "$OS" = "linux" ]; then
            systemctl start mysql
            systemctl enable mysql
        elif [ "$OS" = "macos" ]; then
            brew services start mysql
        fi
        
        print_success "MySQL запущен"
    fi
}

# Установка Git
install_git() {
    print_header "Проверка Git"
    
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git уже установлен: $GIT_VERSION"
    else
        print_info "Установка Git..."
        
        if [ "$OS" = "linux" ] && [ "$DISTRO" = "debian" ]; then
            apt-get install -y git
        elif [ "$OS" = "linux" ] && [ "$DISTRO" = "redhat" ]; then
            yum install -y git
        elif [ "$OS" = "macos" ]; then
            brew install git
        fi
        
        print_success "Git установлен: $(git --version)"
    fi
}

# Клонирование репозитория
clone_repo() {
    print_header "Клонирование репозитория"
    
    INSTALL_DIR="${1:-.}/notes-service"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Директория $INSTALL_DIR уже существует"
        read -p "Перезаписать? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            print_info "Используется существующая директория"
            return
        fi
    fi
    
    git clone https://github.com/abumuslim1/notes-simple.git "$INSTALL_DIR"
    print_success "Репозиторий клонирован в $INSTALL_DIR"
    
    cd "$INSTALL_DIR"
}

# Установка зависимостей
install_dependencies() {
    print_header "Установка зависимостей Node.js"
    
    pnpm install
    print_success "Зависимости установлены"
}

# Создание базы данных
setup_database() {
    print_header "Настройка базы данных"
    
    DB_NAME="notes_service"
    DB_USER="notes_user"
    DB_PASSWORD=$(openssl rand -base64 12)
    
    print_info "Создание базы данных и пользователя..."
    
    mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    print_success "База данных создана"
    print_info "Учетные данные базы данных:"
    echo "  База данных: $DB_NAME"
    echo "  Пользователь: $DB_USER"
    echo "  Пароль: $DB_PASSWORD"
    
    # Сохранение учетных данных
    echo "$DB_PASSWORD" > .db_password
    chmod 600 .db_password
    
    echo "$DB_PASSWORD"
}

# Создание файла .env
setup_env() {
    print_header "Настройка переменных окружения"
    
    DB_PASSWORD=$1
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > .env << EOF
# Database
DATABASE_URL="mysql://notes_user:$DB_PASSWORD@localhost:3306/notes_service"

# JWT Secret
JWT_SECRET="$JWT_SECRET"

# OAuth (опционально)
VITE_APP_ID=""
OAUTH_SERVER_URL=""
VITE_OAUTH_PORTAL_URL=""

# App Configuration
VITE_APP_TITLE="Notes Service"
OWNER_NAME="Admin"
OWNER_OPEN_ID="admin"
EOF
    
    print_success "Файл .env создан"
    print_warning "Отредактируйте .env для добавления OAuth параметров, если необходимо"
}

# Инициализация базы данных
init_database() {
    print_header "Инициализация схемы базы данных"
    
    pnpm db:push
    print_success "Схема базы данных инициализирована"
}

# Сборка приложения
build_app() {
    print_header "Сборка приложения"
    
    pnpm build
    print_success "Приложение собрано"
}

# Запуск приложения
run_app() {
    print_header "Запуск приложения"
    
    print_info "Приложение запускается на http://localhost:3000"
    print_info "Нажмите Ctrl+C для остановки"
    
    pnpm start
}

# Главная функция
main() {
    print_header "Установка Notes Service"
    
    # Проверка ОС
    check_os
    print_success "Обнаружена ОС: $OS ($DISTRO)"
    
    # Установка зависимостей
    install_git
    install_nodejs
    install_pnpm
    install_mysql
    
    # Клонирование и настройка
    clone_repo
    install_dependencies
    
    # Настройка базы данных
    DB_PASSWORD=$(setup_database)
    setup_env "$DB_PASSWORD"
    init_database
    
    # Сборка
    build_app
    
    print_header "Установка завершена!"
    print_success "Notes Service готов к использованию"
    print_info "Для запуска приложения выполните:"
    echo "  cd notes-service"
    echo "  pnpm start"
    
    # Предложение запустить приложение
    read -p "Запустить приложение сейчас? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_app
    fi
}

# Запуск
main "$@"

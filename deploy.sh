#!/bin/bash

# 🚀 AI Tools Aggregator - Production Deployment Script
# Автоматический деплой CLI-парсера на удаленный сервер

set -e  # Выход при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логирование
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Проверка переменных окружения
check_env() {
    log "Проверка переменных окружения..."
    
    if [ -z "$SERVER_HOST" ]; then
        error "SERVER_HOST не установлен. Пример: export SERVER_HOST=your-server.com"
    fi
    
    if [ -z "$SERVER_USER" ]; then
        error "SERVER_USER не установлен. Пример: export SERVER_USER=ubuntu"
    fi
    
    log "✅ Переменные окружения проверены"
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    command -v git >/dev/null 2>&1 || error "Git не найден"
    command -v ssh >/dev/null 2>&1 || error "SSH не найден"
    command -v rsync >/dev/null 2>&1 || error "rsync не найден"
    
    log "✅ Зависимости проверены"
}

# Сборка проекта
build_project() {
    log "Сборка проекта..."
    
    # Установка зависимостей
    pnpm install
    
    # Сборка shared пакета
    pnpm --filter shared run build
    
    # Сборка parser пакета
    pnpm --filter parser run build
    
    log "✅ Проект собран"
}

# Деплой на сервер
deploy_to_server() {
    log "Начинаем деплой на $SERVER_HOST..."
    
    # Создание директории проекта на сервере
    ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p /opt/ai-tools-aggregator"
    
    # Синхронизация файлов
    log "Синхронизация файлов..."
    rsync -avz --delete \
        --exclude node_modules \
        --exclude .git \
        --exclude '*.log' \
        --exclude packages/parser/dev.db \
        --exclude packages/parser/prisma/dev.db \
        ./ "$SERVER_USER@$SERVER_HOST:/opt/ai-tools-aggregator/"
    
    # Удаленная установка и настройка
    ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
        cd /opt/ai-tools-aggregator
        
        # Установка Node.js и pnpm если нужно
        command -v node >/dev/null 2>&1 || {
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        }
        
        command -v pnpm >/dev/null 2>&1 || {
            npm install -g pnpm
        }
        
        # Установка зависимостей
        pnpm install --frozen-lockfile
        
        # Настройка окружения
        if [ ! -f .env ]; then
            cp env.production.example .env
            echo "⚠️  Отредактируйте .env файл с правильными настройками!"
        fi
        
        # Генерация Prisma клиента
        pnpm db:generate
        
        # Установка systemd сервиса (опционально)
        sudo tee /etc/systemd/system/ai-tools-parser.service > /dev/null << 'SERVICE'
[Unit]
Description=AI Tools Parser CLI
After=network.target

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/opt/ai-tools-aggregator
ExecStart=/usr/bin/pnpm parser crawl futuretools
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

        sudo systemctl daemon-reload
        
        echo "✅ Деплой завершен!"
        echo "📝 Следующие шаги:"
        echo "1. Отредактируйте .env файл: nano /opt/ai-tools-aggregator/.env"
        echo "2. Запустите PostgreSQL: docker-compose -f docker-compose.prod.yml up -d"
        echo "3. Создайте таблицы: pnpm db:push"
        echo "4. Протестируйте: pnpm parser demo"
EOF
}

# Основная функция
main() {
    log "🚀 Начинаем деплой AI Tools Aggregator"
    
    check_env
    check_dependencies
    build_project
    deploy_to_server
    
    log "🎉 Деплой успешно завершен!"
    log "Подключитесь к серверу: ssh $SERVER_USER@$SERVER_HOST"
    log "Перейдите в директорию: cd /opt/ai-tools-aggregator"
}

# Справка
show_help() {
    echo "AI Tools Aggregator - Deployment Script"
    echo ""
    echo "Использование:"
    echo "  export SERVER_HOST=your-server.com"
    echo "  export SERVER_USER=ubuntu"
    echo "  ./deploy.sh"
    echo ""
    echo "Опции:"
    echo "  -h, --help    Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  SERVER_HOST=192.168.1.100 SERVER_USER=root ./deploy.sh"
    echo "  SERVER_HOST=my-vps.com SERVER_USER=ubuntu ./deploy.sh"
}

# Обработка аргументов
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac 
#!/bin/bash

# 🚀 AI Tools API - Полный автодеплой скрипт
# Один скрипт для полного обновления и деплоя API
# Использование: ./auto-deploy.sh

set -e

SERVER_HOST="146.103.99.64"
SERVER_USER="root"
SERVER_PASS="a=NxQW25GF=B7L7pv#X5"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }

run_remote() {
    local command="$1"
    local timeout="${2:-60}"
    
    expect -c "
        set timeout $timeout
        spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST \"$command\"
        expect \"password:\"
        send \"$SERVER_PASS\r\"
        expect eof
    " 2>/dev/null
}

check_health() {
    local url="$1"
    local retries=10
    local delay=3
    
    for i in $(seq 1 $retries); do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep $delay
    done
    return 1
}

wait_for_db() {
    log "Ожидание готовности базы данных..."
    local retries=20
    local delay=5
    
    for i in $(seq 1 $retries); do
        if run_remote "cd /opt/ai-tools-aggregator && pnpm db:push" > /dev/null 2>&1; then
            log "✅ База данных готова"
            return 0
        fi
        info "Попытка $i/$retries... ожидание $delay сек"
        sleep $delay
    done
    error "База данных не готова после $((retries * delay)) секунд"
}

main() {
    log "🚀 Начинаем полный автодеплой AI Tools API"
    
    # Этап 1: Подготовка
    log "📋 Этап 1/8: Подготовка..."
    
    if ! command -v expect &> /dev/null; then
        error "expect не найден. Установите: brew install expect (macOS) или apt-get install expect (Linux)"
    fi
    
    # Этап 2: Остановка старых процессов
    log "🛑 Этап 2/8: Остановка старых процессов..."
    run_remote "pkill -f 'node dist/index.js' || echo 'No API processes to kill'"
    run_remote "docker kill \$(docker ps -q) 2>/dev/null || echo 'No containers to kill'"
    run_remote "docker rm \$(docker ps -aq) 2>/dev/null || echo 'No containers to remove'"
    
    # Этап 3: Получение обновлений
    log "📥 Этап 3/8: Получение обновлений из Git..."
    run_remote "cd /opt/ai-tools-aggregator && git fetch origin"
    run_remote "cd /opt/ai-tools-aggregator && git reset --hard origin/main"
    run_remote "cd /opt/ai-tools-aggregator && git clean -fd"
    
    # Этап 4: Установка зависимостей и сборка
    log "🔨 Этап 4/8: Установка зависимостей и сборка..."
    run_remote "cd /opt/ai-tools-aggregator && pnpm install --frozen-lockfile" 120
    run_remote "cd /opt/ai-tools-aggregator && pnpm --filter shared run build" 60
    run_remote "cd /opt/ai-tools-aggregator && pnpm --filter api run build" 60
    
    # Этап 5: Запуск базы данных
    log "🗄️ Этап 5/8: Запуск базы данных..."
    run_remote "cd /opt/ai-tools-aggregator && docker-compose -f docker-compose.prod.yml up -d db" 180
    
    # Этап 6: Ожидание и инициализация БД
    log "⏳ Этап 6/8: Инициализация базы данных..."
    wait_for_db
    
    # Этап 7: Запуск API
    log "🚀 Этап 7/8: Запуск API сервера..."
    run_remote "cd /opt/ai-tools-aggregator/apps/api && nohup node dist/index.js > /tmp/api.log 2>&1 &"
    
    # Этап 8: Проверка работоспособности
    log "🧪 Этап 8/8: Проверка работоспособности..."
    
    if check_health "http://$SERVER_HOST:3001/health"; then
        log "✅ Health check: OK"
    else
        error "Health check провалился"
    fi
    
    # Тестируем основные эндпоинты
    log "🔍 Тестирование эндпоинтов..."
    
    # Test resolve-url endpoint
    if curl -X POST "http://$SERVER_HOST:3001/api/tools/resolve-url" \
       -H "Content-Type: application/json" \
       -d '{"url":"https://github.com"}' \
       -s | jq -e '.finalUrl' > /dev/null 2>&1; then
        log "✅ resolve-url эндпоинт: OK"
    else
        warn "⚠️ resolve-url эндпоинт: есть проблемы"
    fi
    
    # Test demo endpoint  
    if curl -s "http://$SERVER_HOST:3001/api/tools/demo" | jq -e '.items' > /dev/null 2>&1; then
        log "✅ demo эндпоинт: OK"
    else
        warn "⚠️ demo эндпоинт: база данных еще инициализируется"
    fi
    
    # Финальная информация
    log "🎉 Автодеплой завершен успешно!"
    echo ""
    info "📋 Статус сервисов:"
    info "🌐 API: http://$SERVER_HOST:3001"
    info "🔍 Health: http://$SERVER_HOST:3001/health"
    info "🛠️ Tools: http://$SERVER_HOST:3001/api/tools"
    info "🆕 Resolve URL: POST http://$SERVER_HOST:3001/api/tools/resolve-url"
    echo ""
    info "📝 Логи API: ssh root@$SERVER_HOST 'tail -f /tmp/api.log'"
    info "🐳 Docker статус: ssh root@$SERVER_HOST 'docker ps'"
    echo ""
    log "✨ Готово! API обновлен и работает на последней версии"
}

# Обработка аргументов
case "${1:-}" in
    -h|--help)
        echo "AI Tools API - Автодеплой скрипт"
        echo ""
        echo "Использование: ./auto-deploy.sh"
        echo ""
        echo "Что делает скрипт:"
        echo "  1. Останавливает старые процессы"
        echo "  2. Получает последние изменения из Git"
        echo "  3. Устанавливает зависимости и собирает проект"
        echo "  4. Запускает базу данных PostgreSQL"
        echo "  5. Инициализирует схему БД"
        echo "  6. Запускает API сервер"
        echo "  7. Проверяет работоспособность"
        echo ""
        echo "Опции:"
        echo "  -h, --help    Показать эту справку"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
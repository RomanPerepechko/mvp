# 🚀 Развертывание AI Tools Aggregator

Подробные инструкции по развертыванию CLI-парсера и REST API на продакшн сервере.

## 📋 Требования к серверу

### Минимальные требования:
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 2GB (рекомендуется 4GB)
- **CPU**: 2 cores
- **Диск**: 10GB свободного места
- **Network**: стабильное подключение к интернету

### Необходимое ПО:
- Docker & Docker Compose
- Node.js 18+
- Git
- SSH доступ

### Открытые порты:
- **22**: SSH
- **3001**: REST API
- **5432**: PostgreSQL (только локально)

## 🎯 Способы развертывания

### Способ 1: Автоматический деплой (рекомендуется)

```bash
# 1. Клонирование репозитория
git clone https://github.com/RomanPerepechko/mvp.git
cd mvp

# 2. Настройка переменных
export SERVER_HOST=146.103.99.64    # IP вашего сервера
export SERVER_USER=root             # Пользователь для SSH

# 3. Запуск автоматического деплоя
./deploy.sh
```

**Результат автоматического деплоя:**
- ✅ Установка зависимостей
- ✅ Сборка CLI парсера и API
- ✅ Запуск PostgreSQL в Docker
- ✅ Генерация Prisma клиентов
- ✅ Создание таблиц БД

### Способ 2: Ручное развертывание

#### Шаг 1: Подготовка сервера

```bash
# Подключение к серверу
ssh root@146.103.99.64

# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Установка pnpm
npm install -g pnpm
```

#### Шаг 2: Клонирование проекта

```bash
# Создание директории проекта
mkdir -p /opt/ai-tools-aggregator
cd /opt

# Клонирование
git clone https://github.com/RomanPerepechko/mvp.git ai-tools-aggregator
cd ai-tools-aggregator
```

#### Шаг 3: Настройка окружения

```bash
# Создание .env файла
cat > .env <<EOF
# Database
DATABASE_URL="postgresql://ai_tools_user:AiTools2025SecurePwd123@localhost:5432/ai_tools_prod"
POSTGRES_DB=ai_tools_prod
POSTGRES_USER=ai_tools_user
POSTGRES_PASSWORD=AiTools2025SecurePwd123

# Application
NODE_ENV=production
LOG_LEVEL=info

# API
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000
EOF
```

#### Шаг 4: Установка зависимостей

```bash
# Установка пакетов
pnpm install --frozen-lockfile

# Сборка проекта
pnpm --filter shared run build
pnpm --filter parser run build
pnpm --filter api run build

# Генерация Prisma клиентов
pnpm db:generate
cd apps/api && npx prisma generate && cd ../..
```

#### Шаг 5: Запуск сервисов

```bash
# Запуск PostgreSQL
docker-compose -f docker-compose.prod.yml up -d db

# Ожидание готовности БД (30 секунд)
sleep 30

# Создание таблиц
pnpm db:push

# Запуск API (вариант 1: через Docker)
docker-compose -f docker-compose.prod.yml up -d api

# Запуск API (вариант 2: напрямую)
cd apps/api
DATABASE_URL="postgresql://ai_tools_user:AiTools2025SecurePwd123@localhost:5432/ai_tools_prod" \
API_PORT=3001 \
CORS_ORIGIN="http://localhost:3000" \
LOG_LEVEL=info \
node dist/index.js &
```

#### Шаг 6: Тестирование

```bash
# Тест CLI парсера с демо-данными
pnpm parser demo

# Проверка статистики
pnpm parser stats

# Тест API эндпоинтов
curl http://localhost:3001/health
curl http://localhost:3001/api/tools
curl http://localhost:3001/api/categories

# Публичное тестирование API
curl http://146.103.99.64:3001/health
```

## 🌐 Production API

### Эндпоинты в продакшене:

| Method | URL | Описание |
|--------|-----|----------|
| `GET` | `http://146.103.99.64:3001/health` | Health check |
| `GET` | `http://146.103.99.64:3001/api/tools` | Все AI-инструменты |
| `GET` | `http://146.103.99.64:3001/api/tools/demo` | Демо данные |
| `GET` | `http://146.103.99.64:3001/api/categories` | Категории |

### Управление API:

```bash
# Проверка статуса API
curl http://localhost:3001/health

# Логи API
docker-compose -f docker-compose.prod.yml logs api

# Перезапуск API
docker-compose -f docker-compose.prod.yml restart api

# Остановка API
pkill -f "node dist/index.js"

# Запуск API
cd /opt/ai-tools-aggregator/apps/api
DATABASE_URL="postgresql://ai_tools_user:AiTools2025SecurePwd123@localhost:5432/ai_tools_prod" \
API_PORT=3001 node dist/index.js &
```

## 🔧 Настройка автоматизации

### Создание systemd сервисов

#### Сервис для CLI парсера:

```bash
# Создание сервиса для регулярного парсинга
sudo tee /etc/systemd/system/ai-tools-parser.service > /dev/null <<EOF
[Unit]
Description=AI Tools Parser CLI
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/opt/ai-tools-aggregator
ExecStart=/usr/bin/pnpm parser crawl futuretools
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

#### Сервис для API:

```bash
# Создание сервиса для API
sudo tee /etc/systemd/system/ai-tools-api.service > /dev/null <<EOF
[Unit]
Description=AI Tools REST API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ai-tools-aggregator/apps/api
ExecStart=/usr/bin/node dist/index.js
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://ai_tools_user:AiTools2025SecurePwd123@localhost:5432/ai_tools_prod
Environment=API_PORT=3001
Environment=API_HOST=0.0.0.0
Environment=CORS_ORIGIN=http://localhost:3000
Environment=LOG_LEVEL=info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Перезагрузка systemd
sudo systemctl daemon-reload
sudo systemctl enable ai-tools-parser.service
sudo systemctl enable ai-tools-api.service

# Запуск API сервиса
sudo systemctl start ai-tools-api.service
```

### Настройка cron для автоматического парсинга

```bash
# Добавление задачи в cron (парсинг каждые 6 часов)
crontab -e

# Добавить строку:
0 */6 * * * cd /opt/ai-tools-aggregator && /usr/bin/pnpm parser crawl futuretools >> /var/log/ai-tools.log 2>&1
```

### Мониторинг логов

```bash
# Создание директории для логов
mkdir -p /var/log/ai-tools

# Просмотр логов парсера
tail -f /var/log/ai-tools.log

# Просмотр логов API
journalctl -fu ai-tools-api.service

# Логи Docker контейнеров
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔒 Безопасность

### Настройка файрвола

```bash
# Установка и настройка UFW
ufw allow ssh
ufw allow 3001/tcp   # REST API
ufw --force enable

# Проверка статуса
ufw status
```

### Backup базы данных

```bash
# Создание скрипта backup
cat > backup.sh <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p \$BACKUP_DIR

# Backup PostgreSQL
docker exec ai-tools-aggregator-db-1 pg_dump -U ai_tools_user ai_tools_prod > \$BACKUP_DIR/db_backup_\$DATE.sql

# Удаление старых backup (старше 7 дней)
find \$BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup завершен: db_backup_\$DATE.sql"
EOF

chmod +x backup.sh

# Добавление в cron (ежедневный backup в 2 AM)
echo "0 2 * * * /opt/ai-tools-aggregator/backup.sh" | crontab -
```

## 📊 Мониторинг и обслуживание

### Проверка статуса

```bash
# Статус Docker контейнеров
docker-compose -f docker-compose.prod.yml ps

# Статус системных сервисов
systemctl status ai-tools-parser.service
systemctl status ai-tools-api.service

# Просмотр статистики БД
pnpm parser stats

# Тест API
curl http://localhost:3001/health
curl http://localhost:3001/api/tools | jq '.total'

# Проверка логов
docker-compose -f docker-compose.prod.yml logs -f
```

### Обновление проекта

```bash
cd /opt/ai-tools-aggregator

# Получение обновлений
git pull origin main

# Переустановка зависимостей
pnpm install

# Сборка обновлений
pnpm --filter shared run build
pnpm --filter parser run build
pnpm --filter api run build

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart
systemctl restart ai-tools-api.service

# Обновление БД схемы (если нужно)
pnpm db:push
```

## 🚨 Troubleshooting

### Частые проблемы

#### База данных недоступна
```bash
# Проверка статуса контейнера
docker-compose -f docker-compose.prod.yml ps

# Перезапуск БД
docker-compose -f docker-compose.prod.yml restart db

# Проверка логов
docker-compose -f docker-compose.prod.yml logs db
```

#### API не отвечает
```bash
# Проверка статуса API
curl http://localhost:3001/health

# Проверка процессов
ps aux | grep "node dist/index.js"

# Логи API
journalctl -fu ai-tools-api.service

# Перезапуск API
systemctl restart ai-tools-api.service

# Или ручной запуск
pkill -f "node dist/index.js"
cd /opt/ai-tools-aggregator/apps/api
DATABASE_URL="postgresql://ai_tools_user:AiTools2025SecurePwd123@localhost:5432/ai_tools_prod" \
API_PORT=3001 node dist/index.js &
```

#### Ошибки парсинга
```bash
# Проверка с debug логами
pnpm parser crawl futuretools --log-level debug

# Тест в dry-run режиме
pnpm parser crawl futuretools --dry-run
```

#### Недостаточно памяти
```bash
# Проверка использования памяти
free -h
docker stats

# Увеличение swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

#### Проблемы с портами
```bash
# Проверка занятых портов
netstat -tulpn | grep :3001
lsof -i :3001

# Освобождение порта
kill -9 $(lsof -t -i:3001)
```

## 📈 Масштабирование

### Горизонтальное масштабирование

1. **Load Balancer**: Nginx для распределения нагрузки на API
2. **Репликация БД**: Master-Slave PostgreSQL
3. **Кэширование**: Redis для кэширования API ответов
4. **Мониторинг**: Prometheus + Grafana

### Вертикальное масштабирование

```bash
# Увеличение ресурсов Docker
# В docker-compose.prod.yml добавить:
services:
  db:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
  api:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1'
```

### Nginx как reverse proxy

```bash
# Установка Nginx
apt install nginx

# Конфигурация для API
cat > /etc/nginx/sites-available/ai-tools-api <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Активация конфигурации
ln -s /etc/nginx/sites-available/ai-tools-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: 
   - `docker-compose -f docker-compose.prod.yml logs`
   - `journalctl -fu ai-tools-api.service`
2. Проверьте статус: `pnpm parser stats`
3. Тест API: `curl http://localhost:3001/health`
4. Создайте issue в репозитории: https://github.com/RomanPerepechko/mvp
5. Обратитесь к документации Prisma/Playwright/Fastify

---

🎉 **Развертывание завершено!** Ваш AI Tools Aggregator с REST API готов к работе на продакшн сервере. 
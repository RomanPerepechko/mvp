# 🚀 Развертывание AI Tools Aggregator

Подробные инструкции по развертыванию CLI-парсера на продакшн сервере.

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

## 🎯 Способы развертывания

### Способ 1: Автоматический деплой (рекомендуется)

```bash
# 1. Клонирование репозитория
git clone https://github.com/your-username/ai-tools-aggregator.git
cd ai-tools-aggregator

# 2. Настройка переменных
export SERVER_HOST=your-server.com  # IP или домен вашего сервера
export SERVER_USER=ubuntu           # Пользователь для SSH

# 3. Запуск автоматического деплоя
./deploy.sh
```

### Способ 2: Ручное развертывание

#### Шаг 1: Подготовка сервера

```bash
# Подключение к серверу
ssh ubuntu@your-server.com

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка pnpm
npm install -g pnpm
```

#### Шаг 2: Клонирование проекта

```bash
# Создание директории проекта
sudo mkdir -p /opt/ai-tools-aggregator
sudo chown $USER:$USER /opt/ai-tools-aggregator

# Клонирование
cd /opt
git clone https://github.com/your-username/ai-tools-aggregator.git
cd ai-tools-aggregator
```

#### Шаг 3: Настройка окружения

```bash
# Копирование и настройка конфигурации
cp env.production.example .env

# Редактирование .env файла
nano .env
```

Измените в `.env` файле:
```env
DATABASE_URL="postgresql://ai_tools_user:YOUR_SECURE_PASSWORD@localhost:5432/ai_tools_prod"
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
```

#### Шаг 4: Установка зависимостей

```bash
# Установка пакетов
pnpm install --frozen-lockfile

# Сборка проекта
pnpm --filter shared run build
pnpm --filter parser run build

# Генерация Prisma клиента
pnpm db:generate
```

#### Шаг 5: Запуск базы данных

```bash
# Запуск PostgreSQL
docker-compose -f docker-compose.prod.yml up -d db

# Ожидание готовности БД (30 секунд)
sleep 30

# Создание таблиц
pnpm db:push
```

#### Шаг 6: Тестирование

```bash
# Тест с демо-данными
pnpm parser demo

# Проверка статистики
pnpm parser stats

# Тест парсинга (если нужно)
pnpm parser crawl futuretools --limit 10
```

## 🔧 Настройка автоматизации

### Создание systemd сервиса

```bash
# Создание сервиса для регулярного парсинга
sudo tee /etc/systemd/system/ai-tools-parser.service > /dev/null <<EOF
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
EOF

# Перезагрузка systemd
sudo systemctl daemon-reload
sudo systemctl enable ai-tools-parser.service
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
sudo mkdir -p /var/log/ai-tools
sudo chown $USER:$USER /var/log/ai-tools

# Просмотр логов в реальном времени
tail -f /var/log/ai-tools.log
```

## 🔒 Безопасность

### Настройка файрвола

```bash
# Установка и настройка UFW
sudo ufw allow ssh
sudo ufw allow 5432/tcp  # PostgreSQL (только если нужен внешний доступ)
sudo ufw --force enable
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
sudo systemctl status ai-tools-parser.service

# Просмотр статистики БД
pnpm parser stats

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

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart

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
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📈 Масштабирование

### Горизонтальное масштабирование

1. **Load Balancer**: Nginx для распределения нагрузки
2. **Репликация БД**: Master-Slave PostgreSQL
3. **Кэширование**: Redis для кэширования результатов
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
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
2. Проверьте статус: `pnpm parser stats`
3. Создайте issue в репозитории
4. Обратитесь к документации Prisma/Playwright

---

🎉 **Развертывание завершено!** Ваш AI Tools Aggregator готов к работе на продакшн сервере. 
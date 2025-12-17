#!/bin/bash

set -e

echo "=== Тестирование Docker сборки ==="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Шаг 1: Проверка файлов${NC}"
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}✗ Dockerfile не найден${NC}"
    exit 1
fi
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ docker-compose.yml не найден${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Все файлы на месте${NC}"
echo ""

echo -e "${BLUE}Шаг 2: Проверка синтаксиса Dockerfile${NC}"
docker build --no-cache --target builder -t notes-service-test:builder . || {
    echo -e "${RED}✗ Ошибка на этапе builder${NC}"
    exit 1
}
echo -e "${GREEN}✓ Этап builder прошел успешно${NC}"
echo ""

echo -e "${BLUE}Шаг 3: Полная сборка образа${NC}"
docker build --no-cache -t notes-service-test:latest . || {
    echo -e "${RED}✗ Ошибка при полной сборке${NC}"
    exit 1
}
echo -e "${GREEN}✓ Полная сборка прошла успешно${NC}"
echo ""

echo -e "${BLUE}Шаг 4: Проверка размера образа${NC}"
docker images notes-service-test:latest
echo ""

echo -e "${BLUE}Шаг 5: Очистка тестовых образов${NC}"
docker rmi notes-service-test:builder notes-service-test:latest
echo -e "${GREEN}✓ Очистка завершена${NC}"
echo ""

echo -e "${GREEN}=== ✓ Все тесты пройдены успешно! ===${NC}"

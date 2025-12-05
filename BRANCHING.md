# Стратегия ветвления (Git Branching Strategy)

## Обзор

Проект использует двухбранчевую стратегию разработки:

- **`main`** - Стабильная версия для пользователей (production-ready)
- **`develop`** - Версия для разработки (development)

## Бранчи

### main (Production)

- **Назначение**: Стабильная версия приложения для пользователей
- **Когда обновлять**: Только когда новая версия полностью протестирована и готова к выпуску
- **Правила**:
  - Обновляется только через pull requests из `develop`
  - Каждый коммит в `main` должен быть помечен тегом версии (v1.0.0, v1.1.0 и т.д.)
  - Все тесты должны пройти перед merge

### develop (Development)

- **Назначение**: Текущая версия с новыми фичами и исправлениями
- **Когда обновлять**: При добавлении новых функций, исправлении багов
- **Правила**:
  - Основной бранч для разработки
  - Здесь находятся все последние изменения
  - Должен быть всегда в рабочем состоянии (все тесты проходят)

## Рабочий процесс

### 1. Разработка новой функции

```bash
# Убедитесь, что находитесь на develop
git checkout develop
git pull origin develop

# Создайте новый бранч для функции
git checkout -b feature/название-функции

# Разрабатывайте функцию
# ... внесите изменения ...

# Закоммитьте изменения
git add .
git commit -m "feat: описание функции"
git push origin feature/название-функции
```

### 2. Создание Pull Request

1. Откройте GitHub: https://github.com/abumuslim1/notes-simple
2. Нажмите "New Pull Request"
3. Выберите:
   - **Base**: `develop` (куда вливаем)
   - **Compare**: `feature/название-функции` (откуда вливаем)
4. Добавьте описание изменений
5. Нажмите "Create Pull Request"

### 3. Проверка и Merge

- Убедитесь, что все тесты проходят
- Проверьте код на ошибки
- Если все хорошо, нажмите "Merge pull request"
- Удалите бранч после merge

### 4. Выпуск новой версии (Release)

Когда `develop` готов к выпуску:

```bash
# Переключитесь на main
git checkout main
git pull origin main

# Создайте бранч для релиза
git checkout -b release/v1.1.0

# Обновите версию в package.json
# Обновите CHANGELOG.md

# Закоммитьте изменения
git add .
git commit -m "chore: release v1.1.0"

# Создайте pull request в main
git push origin release/v1.1.0
```

После merge в main:

```bash
# Переключитесь на main
git checkout main
git pull origin main

# Создайте тег версии
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0

# Вернитесь в develop и синхронизируйте
git checkout develop
git pull origin main
git push origin develop
```

## Типы коммитов

Используйте следующие префиксы для коммитов:

- **feat**: Новая функция
  ```bash
  git commit -m "feat: добавлена система папок"
  ```

- **fix**: Исправление бага
  ```bash
  git commit -m "fix: исправлена ошибка при загрузке файлов"
  ```

- **docs**: Изменения в документации
  ```bash
  git commit -m "docs: обновлена инструкция по установке"
  ```

- **style**: Изменения стиля кода (форматирование, пробелы)
  ```bash
  git commit -m "style: отформатирован код в NoteEditor.tsx"
  ```

- **refactor**: Переработка кода без изменения функциональности
  ```bash
  git commit -m "refactor: оптимизирована функция поиска"
  ```

- **perf**: Улучшение производительности
  ```bash
  git commit -m "perf: ускорена загрузка заметок"
  ```

- **test**: Добавление или обновление тестов
  ```bash
  git commit -m "test: добавлены тесты для API файлов"
  ```

- **chore**: Изменения в конфигурации, зависимостях
  ```bash
  git commit -m "chore: обновлены зависимости"
  ```

## Примеры рабочего процесса

### Пример 1: Добавление новой функции

```bash
# 1. Переключитесь на develop
git checkout develop
git pull origin develop

# 2. Создайте бранч для функции
git checkout -b feature/export-notes

# 3. Разрабатывайте функцию
# ... внесите изменения ...

# 4. Закоммитьте
git add .
git commit -m "feat: добавлена функция экспорта заметок в PDF"

# 5. Загрузите на GitHub
git push origin feature/export-notes

# 6. Создайте Pull Request на GitHub
# 7. После merge удалите локальный бранч
git branch -d feature/export-notes
```

### Пример 2: Исправление бага

```bash
# 1. Переключитесь на develop
git checkout develop
git pull origin develop

# 2. Создайте бранч для исправления
git checkout -b fix/file-upload-error

# 3. Исправьте баг
# ... внесите изменения ...

# 4. Запустите тесты
pnpm test

# 5. Закоммитьте
git add .
git commit -m "fix: исправлена ошибка при загрузке больших файлов"

# 6. Загрузите на GitHub
git push origin fix/file-upload-error

# 7. Создайте Pull Request на GitHub
```

### Пример 3: Выпуск новой версии

```bash
# 1. Убедитесь, что develop готов
git checkout develop
git pull origin develop

# 2. Создайте бранч для релиза
git checkout -b release/v1.2.0

# 3. Обновите версию
# Отредактируйте package.json: "version": "1.2.0"

# 4. Обновите CHANGELOG.md
# Добавьте записи о новых функциях и исправлениях

# 5. Закоммитьте
git add package.json CHANGELOG.md
git commit -m "chore: release v1.2.0"

# 6. Загрузите на GitHub
git push origin release/v1.2.0

# 7. Создайте Pull Request в main
# 8. После merge в main создайте тег:
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 9. Синхронизируйте develop с main
git checkout develop
git pull origin main
git push origin develop
```

## Правила для Pull Requests

1. **Описание**: Добавьте подробное описание изменений
2. **Тесты**: Убедитесь, что все тесты проходят
3. **Код**: Проверьте код на ошибки и стиль
4. **Документация**: Обновите документацию, если необходимо
5. **Размер**: Старайтесь делать PR не слишком большими (200-500 строк)

## Синхронизация бранчей

### Обновление develop из main (после релиза)

```bash
git checkout develop
git pull origin main
git push origin develop
```

### Обновление feature бранча из develop

```bash
git checkout feature/название-функции
git pull origin develop
git push origin feature/название-функции
```

## Удаление старых бранчей

```bash
# Удалить локальный бранч
git branch -d название-бранча

# Удалить удаленный бранч
git push origin --delete название-бранча

# Удалить все удаленные бранчи, которые были удалены
git fetch origin --prune
```

## Полезные команды

```bash
# Показать все бранчи
git branch -a

# Показать последние коммиты
git log --oneline -10

# Показать статус
git status

# Показать разницу между бранчами
git diff main develop

# Показать коммиты в develop, которых нет в main
git log main..develop
```

## Рекомендации

1. **Регулярно синхронизируйте**: Часто обновляйте свой бранч из develop
2. **Маленькие PR**: Делайте pull requests меньшего размера для легче review
3. **Понятные сообщения**: Пишите ясные и описательные сообщения коммитов
4. **Тестируйте**: Всегда запускайте тесты перед push
5. **Документируйте**: Обновляйте документацию вместе с кодом

---

Для вопросов и обсуждения создавайте issues на GitHub.

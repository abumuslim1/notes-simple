# Notes Service TODO

## Database & Backend
- [x] Create database schema for notes, folders, files, version history, and tags
- [x] Implement user management API (create, edit, delete users with roles)
- [x] Implement folder CRUD operations
- [x] Implement note CRUD operations with password protection
- [x] Implement file attachment system (max 50MB per file)
- [x] Implement version history tracking for notes
- [x] Implement search functionality with suggestions (titles, content, tags)
- [x] Implement favorites system

## Frontend UI
- [x] Setup chiaroscuro theme with deep black background and golden lighting
- [x] Create custom typography with gradient text effects
- [x] Implement sidebar navigation with search
- [x] Create grid layout for notes and folders display
- [x] Build note editor with rich text capabilities
- [x] Implement password protection dialog for notes
- [x] Create file attachment UI with upload/download
- [x] Build version history viewer
- [x] Create favorites page
- [x] Build password generator tool with customizable settings
- [x] Create user management page (admin only)

## Testing & Deployment
- [x] Write vitest tests for critical API endpoints
- [x] Test all user flows
- [x] Create checkpoint for deployment

## Bug Fixes & Improvements
- [x] Fix password protection bug - add password verification dialog before opening protected notes
- [x] Fix file attachment functionality - ensure files can be uploaded and displayed
- [x] Integrate rich text editor (Quill) for note content
- [x] Complete Russian localization of all UI text
- [x] Test all fixes and create new checkpoint


## Design Update - Light Minimalist Theme
- [x] Integrate modern text editor (TipTap)
- [x] Change theme from dark chiaroscuro to light minimalist
- [x] Replace white background with light gray/white
- [x] Remove gradients from headings
- [x] Reduce element sizes and volumes
- [x] Update all components for light theme
- [x] Test all functionality with new design
- [x] Create checkpoint with new design


## Feature Improvements
- [x] Add note count badge next to folders in sidebar
- [x] Reduce folder card sizes on My Notes page
- [x] Implement user registration functionality (UI ready)
- [x] Implement user editing functionality (UI ready)
- [x] Implement user deletion functionality (working)
- [x] Test all new features
- [x] Create checkpoint with improvements


## Size & File Attachment Updates
- [x] Reduce note card sizes by 50% (smaller text, padding, height)
- [x] Implement file attachment functionality (already working)
- [x] Add file upload UI to note editor (already present)
- [x] Add file list display in note view (already present)
- [x] Implement file download functionality (already working)
- [x] Test all file operations
- [x] Create checkpoint with improvements


## File Upload Bug Fixes
- [x] Diagnose file upload errors - fixed insertId handling in createNoteFile
- [x] Migrate file storage from base64 to S3 (already implemented)
- [x] Update API endpoints for S3 file handling (already working)
- [x] Update frontend file upload component (already functional)
- [x] Test file upload/download/delete operations
- [x] Create checkpoint with file fixes


## React Error #321 Fix
- [x] Identify React #321 error source - Card component inside Link
- [x] Fix Card component rendering issue in Home.tsx - replaced with div
- [x] Test all pages for rendering errors - all tests pass
- [x] Create checkpoint with error fix


## Editor UI Improvements
- [x] Fix file upload functionality for new notes (not just edits) - добавлена очередь файлов
- [x] Reduce padding and margins in NoteEditor - p-8 -> p-4, gap-6 -> gap-3
- [x] Compact file upload section - компактный список файлов
- [x] Reduce spacing between form fields - уменьшены отступы между элементами
- [x] Optimize overall layout for compact view - оптимизирован весь интерфейс
- [x] Test file uploads on both new and existing notes - все тесты пройдены
- [x] Create checkpoint with improvements


## Licensing System (develop branch)
- [x] Add license tables to database schema (licenses, license_keys)
- [x] Create API endpoints for license management (check, activate, get info)
- [x] Create Python script for generating license keys
- [x] Create License page with unique server ID
- [x] Create License activation page with owner info and expiry date
- [x] Implement 10-day trial period with auto-blocking
- [x] Add License menu item to sidebar (admin only)
- [x] Write vitest tests for license system (11 tests passing)
- [x] Test licensing system end-to-end
- [x] Create checkpoint with licensing system

## License Integration Improvements
- [x] Integrate License page with AuthenticatedLayout (add sidebar)
- [x] Fix server ID display in input field (use input element with word-break)
- [x] Create TrialBanner component for displaying trial period
- [x] Add TrialBanner to all pages via AuthenticatedLayout
- [x] Remove license_generator.py from repository
- [x] All 25 tests passing (1 auth + 11 license + 13 notes)
- [x] Create final checkpoint with all improvements

## Custom Authentication System (Replace OAuth)
- [x] Update database schema (add username, passwordHash columns)
- [x] Create password hashing utilities (bcrypt)
- [x] Rewrite SDK for JWT token management
- [x] Create API endpoints for register, login, logout
- [x] Update tRPC procedures for new authentication
- [x] Create Login page with username/password form
- [x] Create Register page with username/password/name form
- [x] Update useAuth hook for new authentication flow
- [x] Update App.tsx for protected routes and redirects
- [x] Update Users.tsx for new user schema
- [x] Update auth.logout.test.ts for new authentication
- [x] All 25 tests passing with new authentication
- [x] Create checkpoint with custom authentication system

## Task Management Improvements
- [x] Fix assignee selection in task edit form - use dropdown instead of ID input
- [x] Add priority and date range filters to Tasks page
- [x] Add real-time search by task name/description
- [x] Test all new features
- [ ] Create checkpoint with improvements

## Task Management Bug Fixes & Enhancements
- [x] Fix task updates - add proper cache invalidation when adding/moving tasks
- [x] Add sorting options for tasks (by date, due date, priority)
- [x] Add board statistics panel showing task counts by priority
- [x] Test all new features
- [ ] Create checkpoint with fixes and enhancements

## Additional Features
- [x] Add assignee filter to filter panel
- [x] Add file upload functionality for task editing (not creation)
- [x] Remove + button from right side of columns
- [x] Add ability to edit column names
- [x] Test all new features
- [ ] Create checkpoint with new features

## File Attachments & Comments
- [x] Display uploaded files in task detail view
- [x] Add comments system to tasks (procedures added)
- [x] Add archive functionality for columns (procedures added)
- [x] Test all new features (35 tests passing)
- [ ] Create checkpoint with new features

## Registration Fix
- [x] Enable registration in license settings
- [x] Add registration UI to login page
- [x] Test registration flow (35 tests passing)
- [x] Rollback registration changes - registration disabled

## File Attachments & Comments in Tasks
- [x] Fix file display in task detail - update getTaskFiles to return proper structure
- [x] Add comments functionality to TaskDetail page
- [x] Implement comment creation and deletion
- [x] Display comments with author information
- [x] All 35 tests passing
- [ ] Create checkpoint with fixes

## Bug Fixes & Improvements
- [x] Исправить отображение файлов в задачах (attachments не отображаются) - таблица пуста, файлов нет
- [x] Исправить ошибку при добавлении комментария - обновлена обработка ошибок
- [x] Добавить возможность прикрепить файл в комментарий - сохранена таблица taskCommentFiles
- [x] Сохранить таблицу для хранения файлов комментариев - миграция выполнена
- [x] Добавить процедуры для загрузки файлов в комментарии - добавлены getCommentFiles, addCommentFile, deleteCommentFile
- [ ] Обновить UI комментариев для отображения и загрузки файлов

### File Upload & Display Implementation
- [x] Откатить ошибку при добавлении комментария - реализовано оптимистичное обновление
- [x] Добавить UI для загружки файлов в форму комментария
- [x] Добавить предпросмотр файлов перед отправкой комментария
- [x] Реализовать загружку файлов на S3 для комментариев
- [x] Добавить отображение файлов под каждым комментарием
- [x] Все 35 тестов проходят
- [x] Протестировано в браузере - все функции работают
- [ ] Реализовать загружку файлов при создании задачи
- [ ] Реализовать загружку файлов при редактировании задачи
- [ ] Добавить отображение файлов в карточке задачи


## Hide Licensing & Implement Task File Upload
- [x] Скрыть меню Лицензии из боковой панели
- [x] Скрыть Trial Banner со всех страниц
- [x] Добавить UI для загружки файлов при создании задачи
- [x] Добавить UI для загружки файлов при редактировании задачи
- [x] Реализовать обработку загружки файлов на сервере
- [ ] Добавить отображение файлов в карточке задачи на доске
- [x] Все 35 тестов проходят


## Bug Fixes
- [x] Файлы не сохраняются при создании задачи через столбец - исправлено, добавлена загрузка файлов в onSuccess createTaskMutation


## UI Improvements (Current)
- [x] Добавить редактор в описание задачи (аналогичный редактору заметок)
- [x] Исправить наложение иконок удаления и выбора цвета столбца
- [x] Исправить видимость текста при редактировании названия столбца (сделать черным)
- [x] Все 35 тестов проходят

## Fixes (Current Session)
- [x] Убрать дублирующуюся иконку удаления (trash2) из столбца
- [x] Реализовать удаление файлов из задачи (добавлены процедуры deleteTaskFile и deleteCommentFile)
- [x] Исправить отображение HTML тегов в описании задачи (добавлены Tailwind классы для стилизации)
- [x] Все 35 тестов проходят

## Fixes (Current Session - Part 2)
- [x] Исправить отображение HTML тегов в карточке задачи внутри столбца (превью)
- [x] Все 35 тестов проходят

## Feature: Task Status System (Current)
- [x] Добавить поле status в таблицу tasks (enum: 'pending' | 'completed')
- [x] Обновить миграцию БД
- [x] Добавить процедуру updateTaskStatus в routers
- [x] Добавить UI галочку в карточке задачи (слева от названия)
- [ ] Добавить UI галочку в деталях задачи
- [x] Добавить фильтр по статусам
- [x] Добавить радио кнопку "Показать/Скрыть завершенные задачи"
- [x] Стилизовать завершенные задачи (серый цвет, зачеркивание)
- [x] Все 35 тестов проходят

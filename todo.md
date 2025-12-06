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

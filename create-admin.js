#!/usr/bin/env node

/**
 * Скрипт для создания администратора
 * Использование: node create-admin.js
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к БД
const DB_PATH = join(__dirname, 'data', 'notes.db');

console.log('🔧 Создание администратора...');
console.log(`📁 База данных: ${DB_PATH}`);

try {
  // Подключение к БД
  const db = new Database(DB_PATH);
  
  // Проверка существования таблицы users
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user'
  `).get();
  
  if (!tableExists) {
    console.error('❌ Таблица user не найдена!');
    console.log('💡 Запустите приложение хотя бы раз, чтобы создать таблицы.');
    process.exit(1);
  }
  
  // Проверка существования пользователя admin
  const existingAdmin = db.prepare(`
    SELECT * FROM user WHERE username = ?
  `).get('admin');
  
  if (existingAdmin) {
    console.log('⚠️  Пользователь admin уже существует!');
    console.log('💡 Если вы забыли пароль, удалите пользователя вручную из БД.');
    process.exit(0);
  }
  
  // Хеширование пароля
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  // Создание администратора
  const stmt = db.prepare(`
    INSERT INTO user (id, username, password, role, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  stmt.run(userId, 'admin', hashedPassword, 'admin', now);
  
  console.log('✅ Администратор успешно создан!');
  console.log('');
  console.log('📝 Данные для входа:');
  console.log('   Логин:  admin');
  console.log('   Пароль: admin123');
  console.log('');
  console.log('🔐 Рекомендуется сменить пароль после первого входа!');
  
  db.close();
} catch (error) {
  console.error('❌ Ошибка при создании администратора:', error.message);
  process.exit(1);
}

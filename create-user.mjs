#!/usr/bin/env node

import { createHash } from 'crypto';
import sqlite3 from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Функция для хеширования пароля (bcrypt-подобный формат)
function hashPassword(password) {
  // Простой SHA256 хеш для демонстрации
  // В production используйте bcrypt
  return createHash('sha256').update(password).digest('hex');
}

async function createUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Использование: node create-user.mjs <username> <password> <name> [role]');
    console.log('');
    console.log('Пример:');
    console.log('  node create-user.mjs admin password123 "Administrator" admin');
    console.log('  node create-user.mjs user password123 "John Doe" user');
    process.exit(1);
  }

  const username = args[0];
  const password = args[1];
  const name = args[2];
  const role = args[3] || 'admin'; // По умолчанию админ

  try {
    // Проверяем, используется ли SQLite или MySQL
    const envFile = readFileSync('.env', 'utf-8');
    const dbUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];

    if (!dbUrl) {
      console.error('❌ Ошибка: DATABASE_URL не найден в .env');
      process.exit(1);
    }

    console.log(`📝 Создание пользователя: ${username}`);
    console.log(`📋 Роль: ${role}`);
    console.log(`👤 Имя: ${name}`);
    console.log('');

    if (dbUrl.startsWith('file:')) {
      // SQLite
      const dbPath = dbUrl.replace('file:', '');
      console.log(`📦 Подключение к SQLite: ${dbPath}`);
      
      const db = new sqlite3(dbPath);
      
      // Проверяем, существует ли пользователь
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
      if (existing) {
        console.error(`❌ Ошибка: Пользователь "${username}" уже существует`);
        process.exit(1);
      }

      // Создаем пользователя
      const passwordHash = hashPassword(password);
      const now = new Date();
      
      const stmt = db.prepare(`
        INSERT INTO users (username, passwordHash, name, role, createdAt, updatedAt, lastSignedIn)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        username,
        passwordHash,
        name,
        role,
        now,
        now,
        now
      );

      console.log('✅ Пользователь успешно создан!');
      console.log(`📌 ID: ${result.lastInsertRowid}`);
      console.log(`👤 Логин: ${username}`);
      console.log(`🔐 Пароль: ${password}`);
      console.log('');
      console.log('Вы можете войти в приложение с этими учетными данными.');
      
      db.close();
    } else if (dbUrl.startsWith('mysql://')) {
      // MySQL
      console.log('⚠️  MySQL не поддерживается в этом скрипте');
      console.log('Пожалуйста, используйте SQLite (DATABASE_URL="file:./notes.db")');
      process.exit(1);
    } else {
      console.error('❌ Ошибка: Неподдерживаемый тип БД');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

createUser();

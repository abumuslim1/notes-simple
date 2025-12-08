import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Test insert
  const [result] = await conn.execute(
    'INSERT INTO taskStatusHistory (taskId, userId, oldStatus, newStatus) VALUES (?, ?, ?, ?)',
    [1, 1, 'pending', 'completed']
  );
  console.log('Insert successful:', result);
} catch (e) {
  console.log('Error:', e.message);
  console.log('SQL State:', e.sqlState);
  console.log('SQL Message:', e.sqlMessage);
}

await conn.end();

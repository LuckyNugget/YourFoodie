const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'popup-restaurants.db');
const db = new sqlite3.Database(dbPath);

console.log("🔧 Adding missing user_preferences table...");

db.run(`
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    preference_type TEXT,
    preference_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.log("❌ Error creating user_preferences table:", err.message);
  } else {
    console.log("✅ User preferences table created!");
  }
  
  db.close();
});

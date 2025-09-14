const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'popup-restaurants.db');
const db = new sqlite3.Database(dbPath);

console.log("🗄️  Creating PopUp restaurant database...");

// First, create all tables
db.serialize(() => {
  // Create restaurants table
  db.run(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cuisine_type TEXT,
      address TEXT,
      phone TEXT,
      price_range TEXT,
      rating REAL,
      image_url TEXT,
      is_open BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.log("❌ Error creating restaurants table:", err.message);
    } else {
      console.log("✅ Restaurants table created!");
    }
  });

  // Create events table
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT,
      start_time TEXT,
      end_time TEXT,
      discount_percent INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants (id)
    )
  `, (err) => {
    if (err) {
      console.log("❌ Error creating events table:", err.message);
    } else {
      console.log("✅ Events table created!");
    }
  });

  // Now add sample data (this runs after tables are created)
  console.log("📝 Adding sample restaurant data...");

  const sampleRestaurants = [
    {
      name: "Mario's Late Night Pizza",
      cuisine_type: "Italian", 
      address: "123 Main St, Downtown",
      phone: "(555) 123-4567",
      price_range: "$$",
      rating: 4.5
    },
    {
      name: "Midnight Tacos",
      cuisine_type: "Mexican",
      address: "456 Food Ave, Midtown",
      phone: "(555) 987-6543", 
      price_range: "$",
      rating: 4.2
    }
  ];

  sampleRestaurants.forEach((restaurant) => {
    db.run(`
      INSERT INTO restaurants (name, cuisine_type, address, phone, price_range, rating)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [restaurant.name, restaurant.cuisine_type, restaurant.address, 
        restaurant.phone, restaurant.price_range, restaurant.rating], 
    function(err) {
      if (err) {
        console.log("❌ Error inserting restaurant:", err.message);
      } else {
        console.log(`✅ Added: ${restaurant.name}`);
      }
    });
  });
});

// Close database after everything is done
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error("❌ Error closing database:", err.message);
    } else {
      console.log("\n🎉 Database setup complete!");
    }
  });
}, 3000);

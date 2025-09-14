const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'popup-restaurants.db');
const db = new sqlite3.Database(dbPath);

console.log("🎪 Adding events to PopUp restaurants...");

// Sample events with dates, times, and taglines
const sampleEvents = [
  // Mario's Late Night Pizza events
  {
    restaurant_name: "Mario's Late Night Pizza",
    title: "Late Night Special",
    tagline: "50% off all pizzas after 11 PM - Perfect for night owls!",
    event_type: "late_night",
    start_date: "2025-09-13",
    end_date: "2025-12-31", 
    start_time: "23:00",
    end_time: "02:00",
    discount_percent: 50
  },
  {
    restaurant_name: "Mario's Late Night Pizza", 
    title: "Happy Hour Pizza",
    tagline: "Buy one pizza, get second 25% off during dinner rush",
    event_type: "happy_hour",
    start_date: "2025-09-13",
    end_date: "2025-12-31",
    start_time: "17:00", 
    end_time: "19:00",
    discount_percent: 25
  },
  {
    restaurant_name: "Mario's Late Night Pizza",
    title: "Weekend Brunch Special", 
    tagline: "Free garlic bread with any pizza order on weekends",
    event_type: "weekend_special",
    start_date: "2025-09-14",
    end_date: "2025-12-29",
    start_time: "10:00",
    end_time: "14:00", 
    discount_percent: 15
  },
  // Midnight Tacos events
  {
    restaurant_name: "Midnight Tacos",
    title: "Midnight Munchies",
    tagline: "3 tacos + drink for $7 after midnight - Beat the late night hunger!",
    event_type: "late_night",
    start_date: "2025-09-13",
    end_date: "2025-12-31",
    start_time: "00:00",
    end_time: "03:00",
    discount_percent: 40
  },
  {
    restaurant_name: "Midnight Tacos",
    title: "Taco Tuesday", 
    tagline: "$1.50 tacos all day every Tuesday - Can't beat this deal!",
    event_type: "weekly_special",
    start_date: "2025-09-17", 
    end_date: "2025-12-31",
    start_time: "11:00",
    end_time: "23:00",
    discount_percent: 60
  },
  {
    restaurant_name: "Midnight Tacos",
    title: "Golden Hour Margaritas",
    tagline: "Half price margaritas during sunset - Perfect with tacos!",
    event_type: "golden_hour", 
    start_date: "2025-09-13",
    end_date: "2025-12-31",
    start_time: "17:30",
    end_time: "19:30",
    discount_percent: 50
  }
];

// First, update the events table to include date fields
db.run(`
  ALTER TABLE events ADD COLUMN start_date TEXT;
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.log("Note: start_date column may already exist");
  }
});

db.run(`
  ALTER TABLE events ADD COLUMN end_date TEXT;
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.log("Note: end_date column may already exist");  
  }
});

db.run(`
  ALTER TABLE events ADD COLUMN tagline TEXT;
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.log("Note: tagline column may already exist");
  }
});

// Wait a moment for table updates, then add events
setTimeout(() => {
  console.log("📅 Adding events with dates and taglines...");
  
  sampleEvents.forEach((event) => {
    // First, find the restaurant ID by name
    db.get(`SELECT id FROM restaurants WHERE name = ?`, [event.restaurant_name], (err, restaurant) => {
      if (err) {
        console.log(`❌ Error finding restaurant ${event.restaurant_name}:`, err.message);
        return;
      }
      
      if (!restaurant) {
        console.log(`❌ Restaurant not found: ${event.restaurant_name}`);
        return;
      }
      
      // Insert the event
      db.run(`
        INSERT INTO events (
          restaurant_id, title, description, tagline, event_type, 
          start_date, end_date, start_time, end_time, discount_percent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        restaurant.id,
        event.title,
        event.tagline, // Using tagline as description too
        event.tagline,
        event.event_type,
        event.start_date,
        event.end_date, 
        event.start_time,
        event.end_time,
        event.discount_percent
      ], function(err) {
        if (err) {
          console.log(`❌ Error adding event ${event.title}:`, err.message);
        } else {
          console.log(`✅ Added: ${event.title} at ${event.restaurant_name}`);
          console.log(`   📅 ${event.start_date} to ${event.end_date}, ${event.start_time}-${event.end_time}`);
          console.log(`   💬 "${event.tagline}"`);
        }
      });
    });
  });
  
  // Close database after all events are added
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error("❌ Error closing database:", err.message);
      } else {
        console.log("\n🎉 All events added successfully!");
        console.log("💡 Run 'node test-database.js' to see your events!");
      }
    });
  }, 3000);
  
}, 1000);

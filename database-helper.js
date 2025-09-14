const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class RestaurantDatabase {
  constructor() {
    const dbPath = path.join(__dirname, 'popup-restaurants.db');
    this.db = new sqlite3.Database(dbPath);
  }

  // Get all restaurants, ordered by rating
  getAllRestaurants() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM restaurants 
        ORDER BY rating DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Search restaurants by cuisine type
  getRestaurantsByCuisine(cuisineType) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM restaurants 
        WHERE cuisine_type LIKE ? 
        ORDER BY rating DESC
      `, [`%${cuisineType}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get all active events with restaurant information
  getActiveEvents() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          e.*,
          r.name as restaurant_name,
          r.address,
          r.rating,
          r.cuisine_type
        FROM events e
        JOIN restaurants r ON e.restaurant_id = r.id
        WHERE e.is_active = 1
        ORDER BY e.discount_percent DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get events by type (late_night, happy_hour, etc.)
  getEventsByType(eventType) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          e.*,
          r.name as restaurant_name,
          r.address,
          r.cuisine_type,
          r.rating
        FROM events e
        JOIN restaurants r ON e.restaurant_id = r.id
        WHERE e.event_type = ? AND e.is_active = 1
        ORDER BY e.discount_percent DESC
      `, [eventType], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get restaurants by price range
  getRestaurantsByPriceRange(priceRange) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM restaurants 
        WHERE price_range = ? 
        ORDER BY rating DESC
      `, [priceRange], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Save user preference to database
  saveUserPreference(userId, preferenceType, preferenceValue) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO user_preferences (user_id, preference_type, preference_value)
        VALUES (?, ?, ?)
      `, [userId, preferenceType, preferenceValue], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Get user preferences from database
  getUserPreferences(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM user_preferences 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Close database connection
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

module.exports = RestaurantDatabase;

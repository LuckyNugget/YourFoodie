const RestaurantDatabase = require('./database-helper');

async function testDatabase() {
  console.log("🧪 Testing PopUp restaurant database...\n");
  
  const db = new RestaurantDatabase();
  
  try {
    const restaurants = await db.getAllRestaurants();
    console.log(`📋 Found ${restaurants.length} restaurants:`);
    restaurants.forEach(r => {
      console.log(`   • ${r.name} (${r.cuisine_type}) - ${r.rating}⭐`);
    });

    const events = await db.getActiveEvents();
    console.log(`\n🎪 Found ${events.length} active events:`);
    events.forEach(e => {
      console.log(`   • ${e.restaurant_name}: ${e.title} (${e.discount_percent}% off)`);
    });

    console.log("\n🎉 Database test completed!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    db.close();
  }
}

testDatabase();

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";

async function seedSuperAdmin() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    const db = client.db("school");

    const adminsColl = db.collection("admins");
    const usersColl = db.collection("users");

    const newPassword = "kakhi-kakhidze123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const superAdminUser = {
      name: "Kakhi",
      surname: "Kakhidze",
      user_ID: "kakhi-kakhidze",
      password: hashedPassword,
      role: "superadmin",
      createdAt: new Date().toISOString()
    };

    await adminsColl.updateOne(
      { user_ID: "kakhi-kakhidze" },
      { $set: superAdminUser },
      { upsert: true }
    );

    await usersColl.updateOne(
      { user_ID: "kakhi-kakhidze" },
      { $set: superAdminUser },
      { upsert: true }
    );

    console.log("✅ SUCCESSFULLY SEEDED SUPERADMIN kakhi-kakhidze with password kakhi-kakhidze123");
  } catch (error) {
    console.error("❌ Error seeding superadmin:", error);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

seedSuperAdmin();

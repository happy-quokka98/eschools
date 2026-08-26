import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/";
const dbName = "school";

async function resetAdminPassword() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db(dbName);

    const adminsColl = db.collection("admins");
    const usersColl = db.collection("users");

    const existingAdmins = await adminsColl.find({}).toArray();
    console.log("Existing admins count:", existingAdmins.length);
    existingAdmins.forEach(a => console.log("Admin user_ID:", a.user_ID, "Name:", a.name, a.surname));

    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (existingAdmins.length === 0) {
      console.log("No admins found. Creating a default 'admin' user...");
      const defaultAdmin = {
        name: "Admin",
        surname: "User",
        user_ID: "admin",
        password: hashedPassword,
        role: "admin",
        createdAt: new Date().toISOString()
      };
      await adminsColl.insertOne({ ...defaultAdmin });
      await usersColl.updateOne(
        { user_ID: "admin" },
        { $set: defaultAdmin },
        { upsert: true }
      );
      console.log("✅ Created admin user with user_ID: 'admin' and password: 'admin123'");
    } else {
      console.log("Updating password for existing admin(s)...");
      for (const admin of existingAdmins) {
        await adminsColl.updateOne(
          { _id: admin._id },
          { $set: { password: hashedPassword } }
        );
        await usersColl.updateOne(
          { user_ID: admin.user_ID },
          { $set: { password: hashedPassword } }
        );
        console.log(`✅ Updated password for admin user_ID: '${admin.user_ID}' to 'admin123'`);
      }

      // Also ensure user_ID "admin" exists just in case
      const hasAdminID = existingAdmins.some(a => a.user_ID === "admin");
      if (!hasAdminID) {
        console.log("Creating 'admin' user_ID as well...");
        const defaultAdmin = {
          name: "Admin",
          surname: "User",
          user_ID: "admin",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date().toISOString()
        };
        await adminsColl.insertOne({ ...defaultAdmin });
        await usersColl.updateOne(
          { user_ID: "admin" },
          { $set: defaultAdmin },
          { upsert: true }
        );
        console.log("✅ Created additional admin user with user_ID: 'admin' and password: 'admin123'");
      }
    }

    // Ensure kakhi-kakhidze superadmin user exists
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
    console.log("✅ Configured superadmin user with user_ID: 'kakhi-kakhidze' and password: 'admin123'");
  } catch (error) {
    console.error("❌ Error resetting admin password:", error);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

resetAdminPassword();

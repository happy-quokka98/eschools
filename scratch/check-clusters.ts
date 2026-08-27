import { MongoClient } from "mongodb";

const OLD_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@schools.xqta1tx.mongodb.net/school";
const NEW_URI = "mongodb+srv://kakhiweinrooneykakhidze_db_user:XnInXModwMkw2J3j@gimnazia.zbe8lqs.mongodb.net/?appName=gimnazia";

async function main() {
  console.log("Checking old cluster...");
  let oldClient: MongoClient | null = null;
  try {
    oldClient = new MongoClient(OLD_URI);
    await oldClient.connect();
    const oldDb = oldClient.db("school");
    const oldColls = await oldDb.listCollections().toArray();
    console.log("Old cluster collections:", oldColls.map(c => c.name));
    for (const c of oldColls) {
      const count = await oldDb.collection(c.name).countDocuments();
      console.log(` - Collection '${c.name}': ${count} docs`);
    }
  } catch (err: any) {
    console.error("Old cluster check failed:", err.message);
  } finally {
    if (oldClient) await oldClient.close();
  }

  console.log("\nChecking new cluster...");
  let newClient: MongoClient | null = null;
  try {
    newClient = new MongoClient(NEW_URI);
    await newClient.connect();
    const newDb = newClient.db("school");
    const newColls = await newDb.listCollections().toArray();
    console.log("New cluster collections:", newColls.map(c => c.name));
    for (const c of newColls) {
      const count = await newDb.collection(c.name).countDocuments();
      console.log(` - Collection '${c.name}': ${count} docs`);
    }
  } catch (err: any) {
    console.error("New cluster check failed:", err.message);
  } finally {
    if (newClient) await newClient.close();
  }
}

main();

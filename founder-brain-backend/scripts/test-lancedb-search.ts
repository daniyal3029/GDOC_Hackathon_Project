import { initLanceDb, getChunksTable } from '../src/config/lanceDb';

async function run() {
  try {
    await initLanceDb();
    const table = await getChunksTable();
    const dummyVector = new Float32Array(384).fill(0);
    let query = table.vectorSearch(Array.from(dummyVector));
    query = query.where(`userId = "507f1f77bcf86cd799439011"`);
    const results = await query.limit(5).toArray();
    console.log("Success:", results);
  } catch (err: any) {
    console.error("LanceDB error:", err);
  }
}

run();

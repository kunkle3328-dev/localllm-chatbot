
use rusqlite::{Connection, params};

pub fn store_memory(conn: &Connection, content: &str, embedding: Vec<f32>) {
    let bytes: &[u8] = unsafe {
        std::slice::from_raw_parts(
            embedding.as_ptr() as *const u8,
            embedding.len() * std::mem::size_of::<f32>(),
        )
    };
    conn.execute(
        "INSERT INTO memory (content, embedding) VALUES (?1, ?2)",
        params![content, bytes],
    ).unwrap();
}

pub fn retrieve_relevant(conn: &Connection, _query_embedding: Vec<f32>) -> Vec<String> {
    // V1: Semantic search via SQLite (Actual Cosine Similarity implementation omitted for brevity)
    // Currently returns recent high-importance memories
    let mut stmt = conn.prepare("SELECT content FROM memory ORDER BY importance DESC, id DESC LIMIT 5").unwrap();
    let rows = stmt.query_map([], |row| row.get(0)).unwrap();

    rows.map(|r| r.unwrap()).collect()
}

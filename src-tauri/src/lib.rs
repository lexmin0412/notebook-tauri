use serde::{Deserialize, Serialize};
use sqlx::{mysql::MySqlPoolOptions, MySqlPool, Row};

#[derive(Debug, Serialize, Deserialize)]
pub struct Note {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

struct AppState {
    pool: MySqlPool,
}

fn db_url() -> Result<String, String> {
    std::env::var("DATABASE_URL").map_err(|_| {
        "DATABASE_URL 未设置，请配置 MySQL 连接串，如 mysql://user:pass@host:3306/db".to_string()
    })
}

async fn init_db(pool: &MySqlPool) -> Result<(), String> {
    let ddl = r#"
        CREATE TABLE IF NOT EXISTS notes (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    "#;
    sqlx::query(ddl)
        .execute(pool)
        .await
        .map(|_| ())
        .map_err(|e| format!("初始化表失败: {}", e))
}

#[tauri::command]
async fn create_note_quick(content: String, state: tauri::State<'_, AppState>) -> Result<i64, String> {
    let content_trim = content.trim();
    if content_trim.is_empty() {
        return Err("内容不能为空".into());
    }
    let title = content_trim
        .lines()
        .next()
        .map(|s| s.chars().take(40).collect::<String>())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| format!("快记-{}", chrono::Local::now().format("%Y%m%d-%H%M%S")));

    create_note(title, content, state).await
}

#[tauri::command]
async fn create_note(title: String, content: String, state: tauri::State<'_, AppState>) -> Result<i64, String> {
    if title.trim().is_empty() {
        return Err("标题不能为空".into());
    }
    if content.trim().is_empty() {
        return Err("内容不能为空".into());
    }
    let rec = sqlx::query(r#"INSERT INTO notes (title, content) VALUES (?, ?)"#)
        .bind(title)
        .bind(content)
        .execute(&state.pool)
    .await
    .map_err(|e| format!("创建笔记失败: {}", e))?;
    Ok(rec.last_insert_id() as i64)
}

#[tauri::command]
async fn list_notes(state: tauri::State<'_, AppState>) -> Result<Vec<Note>, String> {
    let rows = sqlx::query(
        r#"SELECT id, title, content, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at FROM notes ORDER BY id DESC"#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| format!("查询笔记失败: {}", e))?;

    let notes = rows
        .into_iter()
        .map(|r| Note {
            id: r.try_get::<i64, _>("id").unwrap_or_default(),
            title: r.try_get::<String, _>("title").unwrap_or_default(),
            content: r.try_get::<String, _>("content").unwrap_or_default(),
            created_at: r.try_get::<String, _>("created_at").ok(),
            updated_at: r.try_get::<String, _>("updated_at").ok(),
        })
        .collect();
    Ok(notes)
}

#[tauri::command]
async fn update_note(id: i64, title: String, content: String, state: tauri::State<'_, AppState>) -> Result<(), String> {
    sqlx::query(r#"UPDATE notes SET title = ?, content = ? WHERE id = ?"#)
        .bind(title)
        .bind(content)
        .bind(id)
        .execute(&state.pool)
    .await
    .map_err(|e| format!("更新笔记失败: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn delete_note(id: i64, state: tauri::State<'_, AppState>) -> Result<(), String> {
    sqlx::query(r#"DELETE FROM notes WHERE id = ?"#)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| format!("删除笔记失败: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = dotenvy::dotenv();
    let url = match db_url() {
        Ok(u) => u,
        Err(e) => {
            eprintln!("{}", e);
            // 继续启动应用，但后续调用会返回错误
            String::new()
        }
    };

    let pool = if url.is_empty() {
        // 生成一个不可用的池占位，避免 Option 处理；后续命令会失败并返回提示
        tauri::async_runtime::block_on(async { MySqlPoolOptions::new().max_connections(1).connect_lazy("mysql://invalid:invalid@localhost:3306/invalid").unwrap() })
    } else {
        tauri::async_runtime::block_on(async {
            MySqlPoolOptions::new()
                .max_connections(5)
                .connect(&url)
                .await
                .expect("连接数据库失败，请检查 DATABASE_URL")
        })
    };

    // 初始化表
    if !url.is_empty() {
        if let Err(e) = tauri::async_runtime::block_on(init_db(&pool)) {
            eprintln!("{}", e);
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState { pool })
        .invoke_handler(tauri::generate_handler![
            create_note_quick,
            create_note,
            list_notes,
            update_note,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

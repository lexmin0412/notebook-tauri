# 快速笔记应用（Tauri + React + Typescript）

实现了两个菜单页：
- 快记：一个多行输入框与保存按钮，快速保存为笔记，标题自动取首行或时间戳。
- 管理：展示所有笔记，支持编辑与删除。

后端使用 Rust + `sqlx` 连接 MySQL 存储，笔记表结构包含：`id`, `title`, `content`, `created_at`, `updated_at`。

## 本地运行

1. 准备 MySQL，并创建数据库（例如 `notebook`）。
2. 设置环境变量 `DATABASE_URL`（示例：`mysql://user:pass@localhost:3306/notebook`）。
   - 可在项目根目录创建 `.env` 文件：
     ```env
     DATABASE_URL=mysql://user:pass@localhost:3306/notebook
     ```
3. 安装依赖并启动：
   ```bash
   pnpm install
   pnpm tauri dev
   ```

首次启动会自动初始化 `notes` 表。

## 前端预览（仅界面）

若仅预览前端界面（不调用后端命令）：
```bash
pnpm dev
```
界面在 `http://localhost:5173`，但保存/编辑/删除会因未运行 Tauri 后端而不可用。

## 说明

- 快记页只输入内容，保存时自动生成标题（首行最多 40 字）。
- 管理页的编辑为简单的多行文本，后续可扩展为 Markdown 编辑等。

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

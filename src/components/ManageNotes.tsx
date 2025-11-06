import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Note } from "../types";

type EditState = {
  id: number;
  title: string;
  content: string;
};

export default function ManageNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<Note[]>("list_notes");
      setNotes(data);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  async function remove(id: number) {
    if (!confirm("确认删除该笔记？")) return;
    try {
      await invoke("delete_note", { id });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  async function saveEdit() {
    if (!edit) return;
    try {
      await invoke("update_note", { id: edit.id, title: edit.title, content: edit.content });
      setNotes((prev) => prev.map((n) => (n.id === edit.id ? { ...n, title: edit.title, content: edit.content } : n)));
      setEdit(null);
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  const list = useMemo(() => notes, [notes]);

  return (
    <div className="manage-notes">
      <div className="section-title">
        <h2>管理</h2>
        <div className="actions">
          <button className="btn" onClick={refresh} disabled={loading}>{loading ? "刷新中..." : "刷新"}</button>
          {error && <span className="toast error">{error}</span>}
        </div>
      </div>
      <div className="list">
        {list.length === 0 && <p className="muted">暂无笔记</p>}
        {list.map((n) => (
          <div key={n.id} className="note-item">
            {edit?.id === n.id ? (
              <div className="edit-form">
                <div className="field">
                  <label className="label">标题</label>
                  <input
                    className="input"
                    value={edit.title}
                    onChange={(e) => setEdit({ ...edit!, title: e.target.value })}
                    placeholder="标题"
                  />
                </div>
                <div className="field">
                  <label className="label">内容</label>
                  <textarea
                    className="textarea"
                    rows={6}
                    value={edit.content}
                    onChange={(e) => setEdit({ ...edit!, content: e.target.value })}
                    placeholder="内容"
                  />
                </div>
                <div className="actions">
                  <button className="btn btn-primary" onClick={saveEdit}>保存</button>
                  <button className="btn" onClick={() => setEdit(null)}>取消</button>
                </div>
              </div>
            ) : (
              <div className="note-view">
                <div className="meta">
                  <strong className="title">{n.title}</strong>
                  <span className="timestamps">
                    {n.created_at && <em>创建: {n.created_at}</em>}
                    {n.updated_at && <em>更新: {n.updated_at}</em>}
                  </span>
                </div>
                <pre className="content">{n.content}</pre>
                <div className="actions">
                  <button className="btn btn-primary" onClick={() => setEdit({ id: n.id, title: n.title, content: n.content })}>编辑</button>
                  <button className="btn btn-danger" onClick={() => remove(n.id)}>删除</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
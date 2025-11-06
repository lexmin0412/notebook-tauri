import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function QuickNote() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    const text = content.trim();
    if (!text) {
      setMsg("内容不能为空");
      return;
    }
    setSaving(true);
    try {
      const id = await invoke<number>("create_note_quick", { content: text });
      setMsg(`已保存（ID: ${id}）`);
      setContent("");
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  const count = content.trim().length;

  return (
    <div className="quick-note">
      <div className="section-title">
        <h2>快记</h2>
        <span className="muted">一条短内容，首行自动生成标题</span>
      </div>
      <div className="field">
        <label className="label">内容</label>
        <textarea
          className="textarea"
          placeholder="随手记点什么...（首行将作为标题）"
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="hint">
          <span className="char-count">{count} 字</span>
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>
        {msg && <span className="toast success">{msg}</span>}
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";

export default function Progress({ ebookId, initialPage }: { ebookId: string; initialPage: number }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const page = Number(new FormData(event.currentTarget).get("page"));
    setBusy(true);
    try {
      const response = await fetch(`/api/ebooks/${ebookId}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page }) });
      setMessage(response.ok ? "Página salva na sua conta." : "Não foi possível salvar a página.");
    } catch { setMessage("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save}><label>Marcar a página onde você parou <input name="page" type="number" min={1} max={100000} defaultValue={initialPage} required /></label><button className="btn" disabled={busy}>Salvar página</button><p role="status">{message}</p></form>;
}

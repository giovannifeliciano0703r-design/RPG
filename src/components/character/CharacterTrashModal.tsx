import { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { CharacterSheet } from "../../types";
import { loadTrashedCharacters, removeTrashItem, type TrashedCharacter } from "../../services/supabaseTrash";

export function CharacterTrashModal({ isOpen, onClose, onRestore }: { isOpen: boolean; onClose: () => void; onRestore: (character: CharacterSheet) => void }) {
  const [items, setItems] = useState<TrashedCharacter[]>([]);
  const [message, setMessage] = useState("Carregando lixeira…");
  useEffect(() => {
    if (!isOpen) return;
    void loadTrashedCharacters().then((data) => { setItems(data); setMessage(data.length ? "" : "A lixeira está vazia."); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Não foi possível abrir a lixeira."));
  }, [isOpen]);
  if (!isOpen) return null;
  const restore = async (item: TrashedCharacter) => {
    await removeTrashItem(item.id);
    onRestore({ ...item.character, updatedAt: Date.now() });
    setItems((previous) => previous.filter((candidate) => candidate.id !== item.id));
  };
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="trash-title">
    <div className="w-full max-w-xl rounded-2xl border border-[#38352A] bg-[#1D1B14] shadow-2xl">
      <header className="flex items-center justify-between border-b border-[#38352A] p-4"><div><h2 id="trash-title" className="font-serif text-lg font-bold">Lixeira de fichas</h2><p className="text-xs text-[#A79C82]">Fichas ficam disponíveis por 30 dias.</p></div><button onClick={onClose} aria-label="Fechar lixeira" title="Fechar" className="p-2"><X className="h-4 w-4" /></button></header>
      <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">{message && <p role="status" className="text-sm text-[#A79C82]">{message}</p>}{items.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#38352A] bg-[#15140F] p-3"><div className="min-w-0"><strong className="block truncate">{item.character.name}</strong><span className="text-[10px] text-[#A79C82]">Excluída em {new Date(item.deletedAt).toLocaleDateString()} • expira em {new Date(item.expiresAt).toLocaleDateString()}</span></div><button onClick={() => void restore(item)} className="flex items-center gap-1 rounded-lg border border-[#4B6B4E] px-3 py-2 text-xs text-[#8DAE8F]"><RotateCcw className="h-3.5 w-3.5" /> Restaurar</button></article>)}</div>
    </div>
  </div>;
}

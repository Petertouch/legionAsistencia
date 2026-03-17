"use client";

import { useState } from "react";
import { useKnowledgeStore, type KnowledgeItem } from "@/lib/stores/knowledge-store";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, X, BookOpen, Filter } from "lucide-react";
import { toast } from "sonner";

export default function ConocimientoPage() {
  const { items, categories, addItem, updateItem, deleteItem, toggleItem, addCategory } = useKnowledgeStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);

  // Form state
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [newCat, setNewCat] = useState("");

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.pregunta.toLowerCase().includes(q) || i.respuesta.toLowerCase().includes(q);
    const matchCat = !catFilter || i.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, KnowledgeItem[]>);

  const activeCount = items.filter((i) => i.activo).length;

  const openCreate = () => {
    setEditing(null);
    setPregunta("");
    setRespuesta("");
    setCategoria("General");
    setShowForm(true);
  };

  const openEdit = (item: KnowledgeItem) => {
    setEditing(item);
    setPregunta(item.pregunta);
    setRespuesta(item.respuesta);
    setCategoria(item.categoria);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!pregunta.trim() || !respuesta.trim()) {
      toast.error("Pregunta y respuesta son requeridas");
      return;
    }
    if (editing) {
      updateItem(editing.id, { pregunta, respuesta, categoria });
      toast.success("Actualizado");
    } else {
      addItem({ pregunta, respuesta, categoria });
      toast.success("Pregunta agregada");
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    toast.success("Eliminado");
  };

  const handleAddCategory = () => {
    if (newCat.trim()) {
      addCategory(newCat.trim());
      setCategoria(newCat.trim());
      setNewCat("");
      toast.success("Categoria creada");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-white text-lg md:text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-oro" /> Base de Conocimiento
          </h2>
          <p className="text-beige/40 text-xs md:text-sm mt-0.5">
            {items.length} preguntas • {activeCount} activas — Alimentan la IA del chatbot
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Nueva pregunta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <input
            type="text"
            placeholder="Buscar preguntas o respuestas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 text-white placeholder-beige/30 text-sm pl-9 pr-4 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beige/30" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-white/5 text-beige/70 text-sm pl-9 pr-8 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Todas las categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-jungle-dark border border-white/10 rounded-xl w-full max-w-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">
                {editing ? "Editar pregunta" : "Nueva pregunta"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-beige/40 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-beige/60 text-xs font-medium mb-1.5 block">Categoria</label>
              <div className="flex gap-2">
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="flex-1 bg-white/5 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Nueva..."
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-24 bg-white/5 text-white placeholder-beige/30 text-sm px-2 py-2 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCat.trim()}
                    className="bg-white/10 text-beige/60 px-2 rounded-lg hover:bg-white/20 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-beige/60 text-xs font-medium mb-1.5 block">Pregunta</label>
              <input
                type="text"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                placeholder="Ej: ¿Qué hago si me llega una citación?"
                className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-beige/60 text-xs font-medium mb-1.5 block">Respuesta</label>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Escribe la respuesta que la IA debe dar..."
                rows={5}
                className="w-full bg-white/5 text-white placeholder-beige/30 text-sm px-3 py-2.5 rounded-lg border border-white/10 focus:border-oro/40 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? "Guardar cambios" : "Agregar"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 text-beige/20 mx-auto mb-3" />
          <p className="text-beige/40 text-sm">No hay preguntas{search || catFilter ? " con ese filtro" : ""}</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat}>
            <h3 className="text-oro/80 text-xs font-bold uppercase tracking-wider mb-2 px-1">{cat}</h3>
            <div className="space-y-2">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white/5 border rounded-xl p-3.5 md:p-4 transition-all ${
                    item.activo ? "border-white/10" : "border-white/5 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium mb-1.5">{item.pregunta}</p>
                      <p className="text-beige/50 text-xs leading-relaxed line-clamp-3">{item.respuesta}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleItem(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.activo ? "text-green-400 hover:bg-green-500/10" : "text-beige/30 hover:bg-white/5"
                        }`}
                        title={item.activo ? "Desactivar" : "Activar"}
                      >
                        {item.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-beige/30 hover:text-oro hover:bg-oro/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-beige/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

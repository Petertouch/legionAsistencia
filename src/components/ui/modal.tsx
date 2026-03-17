"use client";

import { useEffect, useRef } from "react";
import Button from "./button";

export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-transparent backdrop:bg-black/60 p-4 max-w-lg w-full"
    >
      <div className="bg-jungle-dark border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-beige/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 text-beige/70 text-sm">{children}</div>
        {actions && (
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/10">
            {actions}
          </div>
        )}
      </div>
    </dialog>
  );
}

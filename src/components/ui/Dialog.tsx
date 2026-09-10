import { useEffect, useId, useRef } from "react";
import { AlertTriangle, Info } from "lucide-react";

const openDialogs: HTMLDivElement[] = [];

interface DialogBaseProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

interface ConfirmDialogProps extends DialogBaseProps {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

function DialogFrame({
  isOpen,
  title,
  description,
  onClose,
  children,
  tone = "warning",
}: DialogBaseProps & { children: React.ReactNode; tone?: "warning" | "info" }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openDialogs.push(dialog);
    dialog.focus();
    const isTopDialog = () => openDialogs.at(-1) === dialog;
    const onFocusIn = (event: FocusEvent) => {
      if (isTopDialog() && !dialog.contains(event.target as Node)) dialog.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopDialog() || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
      }
      if (event.key === "Tab") {
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]',
        )).filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') &&
          !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
          getComputedStyle(element).display !== 'none' && getComputedStyle(element).visibility !== 'hidden');
        if (!focusable.length) { event.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const focused = document.activeElement as HTMLElement;
        if (event.shiftKey && (focused === first || !focusable.includes(focused))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (focused === last || !focusable.includes(focused))) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      const wasTop = isTopDialog();
      openDialogs.splice(openDialogs.indexOf(dialog), 1);
      if (wasTop && previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const Icon = tone === "warning" ? AlertTriangle : Info;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <button type="button" tabIndex={-1} aria-label="Fechar diálogo" onClick={onClose} className="absolute inset-0 cursor-default" />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl border border-[#5C5641] bg-[#1D1B14] p-5 text-[#EFE8D8] shadow-2xl outline-none"
      >
        <div className="flex gap-3">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === "warning" ? "text-[#C4645A]" : "text-[#DFB56C]"}`} />
          <div>
            <h2 id={titleId} className="font-serif text-lg font-bold">{title}</h2>
            <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-[#A79C82]">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <DialogFrame isOpen={isOpen} title={title} description={description} onClose={onClose}>
      <button type="button" onClick={onClose} className="rounded-xl border border-[#38352A] px-4 py-2 text-sm text-[#D6CEBE] hover:bg-[#25231B]">
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={() => {
          onConfirm();
          onClose();
        }}
        className={`rounded-xl px-4 py-2 text-sm font-bold ${destructive ? "bg-[#7A2E27] text-white hover:bg-[#8F392F]" : "bg-[#DFB56C] text-[#15140F] hover:bg-[#F3CF8A]"}`}
      >
        {confirmLabel}
      </button>
    </DialogFrame>
  );
}

export function NoticeDialog({ isOpen, title, description, onClose }: DialogBaseProps) {
  return (
    <DialogFrame isOpen={isOpen} title={title} description={description} onClose={onClose} tone="info">
      <button type="button" autoFocus onClick={onClose} className="rounded-xl bg-[#DFB56C] px-4 py-2 text-sm font-bold text-[#15140F] hover:bg-[#F3CF8A]">
        Entendi
      </button>
    </DialogFrame>
  );
}

'use client';

import { useEffect, useCallback, useRef, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label?: string;
}

export default function Modal({ isOpen, onClose, children, className = "", label = "Dialog" }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      document.body.classList.add("popup-open");
      document.addEventListener("keydown", handleKeyDown);

      // Focus first focusable element in modal
      requestAnimationFrame(() => {
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      });
    } else {
      document.body.classList.remove("popup-open");
      // Restore focus to trigger element
      (previousFocus.current as HTMLElement)?.focus();
    }

    return () => {
      document.body.classList.remove("popup-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`bg-warm-white rounded-[30px] shadow-2xl overflow-auto max-h-[90vh] relative hide-scrollbar ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <button
          onClick={onClose}
          className="closeButton"
          aria-label="Close dialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 50 50"
            fill="#8b5e3c"
            className="w-full h-full cursor-pointer"
            aria-hidden="true"
          >
            <path d="M 7.71875 6.28125 L 6.28125 7.71875 L 23.5625 25 L 6.28125 42.28125 L 7.71875 43.71875 L 25 26.4375 L 42.28125 43.71875 L 43.71875 42.28125 L 26.4375 25 L 43.71875 7.71875 L 42.28125 6.28125 L 25 23.5625 Z" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

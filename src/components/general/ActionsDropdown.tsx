import { FaEllipsisH } from "react-icons/fa";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ActionsDropdown.scss";

export type DropdownAction = {
    label: string;
    action: (id: string) => void;
};

type ActionsDropdownProps = {
    id: string;
    actions: DropdownAction[];
};

export default function ActionsDropdown({ id, actions }: ActionsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
        top: 0,
        left: 0,
        width: 0,
    });
    const triggerRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const toggleDropdown = () => setIsOpen((prev) => !prev);
    const close = () => setIsOpen(false);

    // Compute viewport position when opened (and on resize/scroll)
    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePos = () => {
            const r = triggerRef.current!.getBoundingClientRect();
            setPos({ top: r.bottom, left: r.right, width: r.width });
        };

        updatePos();

        window.addEventListener("scroll", updatePos, true);
        window.addEventListener("resize", updatePos);
        return () => {
            window.removeEventListener("scroll", updatePos, true);
            window.removeEventListener("resize", updatePos);
        };
    }, [isOpen]);

    // Close on outside click / ESC (use "click", not "mousedown")
    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
        const onClickDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (triggerRef.current?.contains(t)) return; // click on trigger
            if (menuRef.current?.contains(t)) return;    // click inside menu
            close();                                     // genuine outside click
        };

        document.addEventListener("keydown", onKey);
        document.addEventListener("click", onClickDoc);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("click", onClickDoc);
        };
    }, [isOpen]);

    return (
        <div className="actions-dropdown" ref={triggerRef}>
            <button
                type="button"
                className="actions-kebab"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={toggleDropdown}
            >
                <FaEllipsisH size={20} />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="dropdown-menu-portal"
                        role="menu"
                        style={{
                            position: "fixed",
                            top: pos.top,
                            left: pos.left,
                            transform: "translateX(-100%)", // right-align with trigger
                            zIndex: 10000,
                        }}
                    >
                        {actions.map(({ label, action }) => (
                            <button
                                key={label}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    action(id); // run first
                                    close();    // then close
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
}

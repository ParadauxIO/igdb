import { FaEllipsisH } from "react-icons/fa";
import { useState } from "react";
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

    const toggleDropdown = () => {
        setIsOpen(prev => !prev);
    };

    const handleAction = async (actionFn: (id: string) => Promise<void> | void) => {
    try {
        await actionFn(id);  // wait for action to finish if it's async
    } catch (e) {
        console.error("Action failed:", e);
    }
    setIsOpen(false);
    window.location.reload();
    };

    return (
        <div className="actions-dropdown">
            <div onClick={toggleDropdown}>
                <FaEllipsisH className="actions-kebab" size={24} color="#6c757d" />
            </div>

            {isOpen && (
                <div className="dropdown-menu">
                    {actions.map(({ label, action }) => (
                        <button key={label} onClick={() => handleAction(action)}>
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
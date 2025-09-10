import ImageCarousel from "./ImageCarousel.tsx";
import "./Update.scss";
import type { DogUpdate } from "../../types/DogUpdate.ts";
import ActionsDropdown, { type DropdownAction } from "../general/ActionsDropdown.tsx";

type UpdateProps = {
    update: DogUpdate;
    isAdmin: boolean | null;
    removeUpdate: (id: string) => void;
};

export default function Update({ update, isAdmin, removeUpdate }: UpdateProps) {
    const admin = !!isAdmin;
    const isApproved = !!update.update_date_approved;
    const created = new Date(update.update_created_at);

    const actions: DropdownAction[] = [
        { label: admin ? "Remove" : "Cancel", action: removeUpdate } // or () => removeUpdate(update.update_id)
    ];

    return (
        <div className={`update-item ${isApproved ? "approved" : "unapproved"}`}>
            <h2>{update.update_title}</h2>
            <p>{update.update_description}</p>

            {update.update_media_urls?.length ? (
                <ImageCarousel images={update.update_media_urls} />
            ) : null}

            {!isApproved && (
                <span className="approval-notice" aria-live="polite">
          This post has not yet been approved, and is only visible to you.
        </span>
            )}

            <div className="update-footer">
                <div className="time">
                    <time dateTime={created.toISOString()}>{created.toLocaleString()}</time>
                </div>
                {(!isApproved || admin) && (
                    <ActionsDropdown id={update.update_id} actions={actions} />
                )}
            </div>
        </div>
    );
}

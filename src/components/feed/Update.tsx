import ImageCarousel from "./ImageCarousel.tsx";
import "./Update.scss";
import type {DogUpdate} from "../../types/DogUpdate.ts";
import ActionsDropdown, {type DropdownAction} from "../general/ActionsDropdown.tsx";

type UpdateProps = {
    update: DogUpdate;
    isAdmin: boolean | null;
    removeUpdate: (id: string) => void;
}

export default function Update({update, isAdmin, removeUpdate}: UpdateProps) {
    const isApproved = Boolean(update.update_date_approved)

    const actions: DropdownAction[] = [
        {
            label: isAdmin ? "Remove" : "Cancel",
            action: removeUpdate
        }
    ]

    return (
        <div key={update.update_id} className={`update-item ${isApproved ? "approved" : "unapproved"}`}>
            <h2>{update.update_title}</h2>
            <p>{update.update_description}</p>
            {update.update_media_urls && update.update_media_urls.length > 0 && (
                <ImageCarousel images={update.update_media_urls}/>
            )}
            {!isApproved && (
                <span
                    className="approval-notice">This post has not yet been approved, and is only visible to you.</span>
            )}
            <div className="update-footer">
                <div className="time">{new Date(update.update_created_at).toLocaleString()}</div>
                {(!isApproved || isAdmin) && (
                    <ActionsDropdown id={update.update_id} actions={actions}/>
                )}
            </div>
        </div>
    )
}
import ImageCarousel from "../ImageCarousel.tsx";
import "./Update.scss";
import type {DogUpdate} from "../../types/DogUpdate.ts";
import {FaEllipsisH} from "react-icons/fa";

export default function Update({update, isAdmin}: { update: DogUpdate, isAdmin: boolean | null }) {
    const isApproved = Boolean(update.update_date_approved)

    return (
        <div key={update.update_id} className={`update-item ${isApproved ? "approved" : "unapproved"}`}>
            <h2>{update.update_title}</h2>
            <p>{update.update_description}</p>
            {update.update_media_urls && update.update_media_urls.length > 0 && (
                <ImageCarousel images={update.update_media_urls}/>
            )}
            { !isApproved && (
                <span className="approval-notice">This post has not yet been approved, and is only visible to you.</span>
            )}
            <div className="update-footer">
                <div className="time">{new Date(update.update_created_at).toLocaleString()}</div>
                { isAdmin && (
                    <FaEllipsisH className="actions"/>
                )}
            </div>

        </div>
    )

}
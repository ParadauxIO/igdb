import ImageCarousel from "../ImageCarousel.tsx";
import "./Update.scss";
import type {DogUpdate} from "../../types/DogUpdate.ts";

export default function Update({update}: { update: DogUpdate }) {
    const isApproved = Boolean(update.update_date_approved)

    return (
        <div key={update.update_id} className={`update-item ${isApproved ? "approved" : "unapproved"}`}>
            <h2 className="">{update.update_title}</h2>
            <p className="">{update.update_description}</p>
            {update.update_media_urls && update.update_media_urls.length > 0 && (
                <ImageCarousel images={update.update_media_urls}/>
            )}
            <div className="time">{new Date(update.update_created_at).toLocaleString()}</div>
            { !isApproved && (
                <span>This post has not yet been approved, and is only visible to you.</span>
            )}
        </div>
    )

}
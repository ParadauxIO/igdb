import "./StatusCard.scss";

export default function StatusCard({message, isError}: { message: string | null, isError: boolean }) {
    return (
        <div className={"status-card"}>
            {message && (
                <div className={"status-message-card " + (isError ? "error" : "success")}>
                    <h3>{isError ? "Failure" : "Success!"}</h3>
                    <p>{message}</p>
                </div>
            )}
        </div>
    )
}
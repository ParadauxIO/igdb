import './NotificationBox.scss';
import { Link } from "react-router";

type Props = {
  message: string;
  onClose: () => void;
  linkText?: string;
  linkHref?: string;
};

export default function NotificationBox({ message, onClose, linkText, linkHref }: Props) {
  return (
    <div className="notification-box">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      <p className="message">{message}</p>
      {linkText && linkHref && (
        <p className="link-wrapper">
          <Link to={linkHref} className="link">
            {linkText}
          </Link>
        </p>
      )}
    </div>
  );
}
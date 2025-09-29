import './NotificationBox.scss';

type Props = {
  message: string;
  onClose: () => void;
};

export default function NotificationBox({ message, onClose }: Props) {
  return (
    <div className="notification-box bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded mb-4 relative">
      <button onClick={onClose} className="absolute top-1 right-2 text-lg font-bold">
        ×
      </button>
      <p>{message}</p>
    </div>
  );
}
import { FaCheckCircle } from 'react-icons/fa';

interface ToastProps {
  message: string;
}

function Toast({ message }: ToastProps) {
  return (
    <div className="alert-toast">
      <FaCheckCircle className="text-lg shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
    </div>
  );
}

export default Toast;

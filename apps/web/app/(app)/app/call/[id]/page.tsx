import { useParams } from 'next/navigation';

export default function CallRoomPage() {
  const params = useParams();
  const callId = params?.id;
  return (
    <div>
      <h1>Call Room</h1>
      <p>Call ID: {callId}</p>
    </div>
  );
} 
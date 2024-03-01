import Link from 'next/link';
import { useEffect, useState } from 'react';
import sendFriendRequest from '@/services/sendFriendRequest';
import removeFriend from '@/services/removeFriend';
import cancelFriendRequest from '@/services/cancelFriendRequest';
import { useSocket } from '@/contexts/socketContext';
import { ContactsItems, FriendshipStatus } from './types';
import createNewConv from '@/services/createNewConv';
import { useRouter } from 'next/navigation';

interface ContactsProps {
  username: string;
  me: boolean;
  status: false | FriendshipStatus;
  url: string;
  email: string;
  id: number | null;
}

const Contacts: React.FC<ContactsProps> = ({
  username,
  me,
  status,
  url,
  email,
  id,
}) => {
  const [isClicked, setIsClicked] = useState<'send' | 'cancel' | ''>('');
  const [friendshipState, setFriendshipState] = useState<
    FriendshipStatus | false
  >(status);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('friend-request-declined', (data) => {
        setFriendshipState(false);
      });
      socket.on('friend-request-accepted', (data) => {
        setFriendshipState(FriendshipStatus.ACCEPTED);
      });
      socket.on('friend-removed', (data) => {
        setFriendshipState(false);
      });
    }
  }, [socket]);

  useEffect(() => {
    setFriendshipState(status);
  }, [status]);

  const router = useRouter();
  const createRoom = async () => {
    const payload = {
      type: 'DM',
      participants: id ? [id] : [],
    };

    createNewConv(payload).then((res) => {
      if (res) {
        router.push(`/messages/${res.id}`);
      }
    });
  };

  const handleSendFriendRequest = () => {
    sendFriendRequest(id).then((res) => {
      res && setFriendshipState(res.friendshipStatus);
    });
  };

  const handleCancelFriendRequest = () => {
    cancelFriendRequest(id).then((res) => {
      res && setFriendshipState(false);
    });
  };

  const handleRemoveFriend = () => {
    removeFriend(id).then((res) => {
      res && setFriendshipState(false);
    });
  };

  return (
    <div className="flex justify-center gap-4 px-6">
      {!me && friendshipState == false && (
        <button
          onClick={handleSendFriendRequest}
          className={`
          rounded-xl
          bg-[${ContactsItems.sendRequest.color}]
          p-2
          `}
        >
          {ContactsItems.sendRequest.icon}
        </button>
      )}
      {!me && friendshipState == FriendshipStatus.PENDING && (
        <button
          onClick={handleCancelFriendRequest}
          className={`
          rounded-xl
          bg-[${ContactsItems.cancelRequest.color}]
          p-2
          `}
        >
          {ContactsItems.cancelRequest.icon}
        </button>
      )}
      {!me && friendshipState == FriendshipStatus.ACCEPTED && (
        <button
          onClick={handleRemoveFriend}
          className={`
          rounded-xl
          bg-[${ContactsItems.acceptRequest.color}]
          p-2
          `}
        >
          {ContactsItems.acceptRequest.icon}
        </button>
      )}

      {!me && (
        <button
          onClick={() => {
            createRoom();
          }}
          className={`
      rounded-xl
      bg-[${ContactsItems.sendMessage.color}]
      p-2`}
        >
          {ContactsItems.sendMessage.icon}
        </button>
      )}

      <Link
        target="_blank"
        href={`mailto:${email}`}
        className={`
        rounded-md
                        bg-white/10
                        p-2
                        `}
      >
        {/* {ContactsItems.intra.icon} */}
        {
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="64"
            height="64"
          >
            <path
              d="M29.986 27.715H2.008C.915 27.715 0 26.85 0 25.733V6.376A2.01 2.01 0 0 1 2.008 4.37h27.978c1.093 0 2.008.9 2.008 2.008v19.33c-.025 1.144-.915 2.008-2.008 2.008z"
              fill="#f2f2f2"
            />
            <path
              d="M4 27.715l11.97-8.76.076-.508L3.7 9.578l-.025 17.705z"
              opacity=".1"
              fill="#221f1f"
            />
            <g fill="#d44c3d">
              <path d="M2.008 27.715C.9 27.715 0 26.85 0 25.733V6.35c0-1.118.9-1.32 2.008-1.32s2.008.23 2.008 1.32v21.364z" />
              <path d="M2.008 5.334c1.423 0 1.703.432 1.703 1.016v21.084H2.008c-.94 0-1.703-.762-1.703-1.703V6.35c-.025-.6.28-1.016 1.703-1.016zm0-.28C.9 5.055 0 5.283 0 6.35v19.356a1.98 1.98 0 0 0 2.008 2.008h2.008V6.35C4 5.258 3.126 5.055 2.008 5.055zm27.978.28c1.296 0 1.703.254 1.703.966v19.458c0 .94-.762 1.703-1.703 1.703h-1.703V6.3c-.025-.737.407-.966 1.703-.966zm0-.28c-1.118 0-2.008.152-2.008 1.245v21.44h2.008c1.118 0 2.008-.9 2.008-2.008V6.274c-.025-1.093-.915-1.22-2.008-1.22z" />
              <path d="M29.986 27.715h-2.008V6.3c0-1.118.9-1.245 2.008-1.245s2.008.152 2.008 1.245v19.458a2 2 0 0 1-2.008 1.957z" />
            </g>
            <path
              d="M21.422 27.715L.178 7.2l1.118.457 14.8 10.647L31.993 6.63v19.128a1.99 1.99 0 0 1-2.008 1.982z"
              opacity=".08"
              fill="#221f1f"
            />
            <g fill="#d44c3d">
              <path d="M15.96 18.98L.864 8.028c-.9-.66-1.144-1.93-.483-2.82s1.93-1.093 2.846-.432l12.757 9.275L28.817 4.65c.9-.66 2.135-.457 2.795.457.66.9.457 2.135-.457 2.795z" />
              <path d="M29.986 4.572c.534 0 1.067.254 1.398.712.534.762.38 1.83-.38 2.4L15.96 18.625 1.042 7.8C.28 7.24.076 6.147.6 5.4c.305-.457.84-.737 1.423-.737.38 0 .737.102 1.016.33l12.73 9.25.178.102.178-.102 12.82-9.393c.33-.178.66-.28 1.042-.28zm0-.305c-.407 0-.84.102-1.17.38L15.984 14.05 3.202 4.75c-.33-.254-.762-.38-1.194-.38-.635.025-1.27.305-1.652.84-.635.9-.38 2.135.508 2.795L15.96 18.98 31.155 7.9a2.02 2.02 0 0 0 .457-2.795c-.407-.534-1.016-.84-1.626-.84z" />
            </g>
          </svg>
        }
      </Link>
    </div>
  );
};

export default Contacts;

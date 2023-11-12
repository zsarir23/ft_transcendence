import Image from "next/image";
import { NotificationsType } from "./Notifications";
import acceptFirendRequest from "@/services/acceptFriendRequest";
import deleteNotification from "@/services/deleteNotification";
import declineFirendRequest from "@/services/declineFriendRequest";

const FriendRequest: React.FC<NotificationsType> = (notif) => {
  const handleAccept = () => {
    acceptFirendRequest(notif.senderUsername).then(() => {
      deleteNotification(notif.id );
    });
  };

  const handleDecline = () => {
    declineFirendRequest(notif.senderUsername).then(() => {
      deleteNotification(notif.id);
    })
  };

  console.log("avata: " + notif.senderAvatar);
  return (
    <div className="bordder text-white/80 w-full h-20 text-[0.8rem] px-2 font-normal bg-[#3A386A]  flex justify-between rounded-2xl gap-2">
      <Image
        alt=""
        src={notif.senderAvatar}
        width={20}
        height={20}
        className="w-[2.5rem] h-[2.5rem] rounded-full  self-center"
      />
      <p className="text-center self-center ">{notif.senderUsername} wants to be you friend</p>
      <div className="flex flex-col justify-center gap-1 py-2 text-xs">
        <button
          className=" rounded-md py-1 px-[0.6rem] bg-[#605cac] "
          onClick={handleAccept}
        >
          accept
        </button>
        <button
          className="rounded-md py-1 px-[0.6rem] border border-[#605cac] text-[#605cac]"
          onClick={handleDecline}
        >
          decline
        </button>
      </div>
    </div>
  );
};

export default FriendRequest;

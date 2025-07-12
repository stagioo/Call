import { useState } from "react";
import { Header } from "../_components/page";
import { IconUsers } from "@tabler/icons-react";
import { Contact } from "./_components/page";

import { SendInvitationContacts } from "./_components/__components/page";


const FriendsSection = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);

 
  return (
    <div className="w-full h-full bg-[#171717] rounded-l-lg p-5 border border-[#222]">
      <div className="w-full h-full flex flex-col">
        {/* header */}
        <Header
          icon={<IconUsers size={18} />}
          title="Contacts"
          ctaText="Add contact"
          onCtaClick={() => setShowInviteModal(true)}
          onNotificationClick={() => console.log("Notification clicked")}
        />
        {/* Friend section */}
        <div className="w-full h-full flex flex-col ">
          <Contact />
    
        </div>
      </div>
      {/* Invite Modal */}
      <SendInvitationContacts open={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </div>
  );
};

export default FriendsSection;

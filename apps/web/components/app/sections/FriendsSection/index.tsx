import { Header } from "../_components/page";
import { IconUsers } from "@tabler/icons-react";
import { Contact } from "./_components/page";
const FriendsSection = () => {
  return (
    <div className="w-full h-full bg-[#171717] rounded-l-lg p-5 border border-[#222]">
      <div className="w-full h-full flex flex-col">
        {/* header */}
        <Header
          icon={<IconUsers size={18} />}
          title="Contacts"
          ctaText="Add contact"
          onCtaClick={() => console.log("Start Call clicked")}
          onNotificationClick={() => console.log("Notification clicked")}
        />
        {/* Friend section */}
        <div className="w-full h-full flex flex-col ">
          <Contact />
          <Contact />
          <Contact />
        </div>
      </div>
    </div>
  );
};

export default FriendsSection;

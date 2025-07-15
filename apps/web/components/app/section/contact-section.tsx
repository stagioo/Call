import ContactsList from "./contacts-list";
import ContactPage from "@/app/(app)/contact/page";

export const ContactSection = ({ onAddContact }: { onAddContact?: () => void }) => {
  return (
    <div>
      <ContactPage />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Contacts</h1>
        {onAddContact && (
          <button
            className="bg-primary text-white rounded px-4 py-2 hover:bg-primary/80 transition"
            onClick={onAddContact}
          >
            Add Contact
          </button>
        )}
      </div>
      <ContactsList />
    </div>
  );
};

export default ContactSection;

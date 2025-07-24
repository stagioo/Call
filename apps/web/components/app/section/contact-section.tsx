import ContactsList from "./contacts-list";

export const ContactSection = ({ onAddContact }: { onAddContact?: () => void }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
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

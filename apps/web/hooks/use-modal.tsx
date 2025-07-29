import type { Team } from "@/lib/types";
import { create } from "zustand";

type ModalType =
  | "create-team"
  | "add-member"
  | "start-call"
  | "create-contact"
  | "thoughts"
  | "add-member-to-team";

interface ModalData {
  team?: Team;
}

interface ModalStore {
  type: ModalType | null;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
  data: ModalData;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  isOpen: false,
  data: {},
  onOpen: (type, data?: ModalData) => set({ type, isOpen: true, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));

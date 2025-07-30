import { useMemo } from "react";
import { useCall } from "../providers/CallProvider";
import type { Participant, Self } from "../types/participant";

export interface UseParticipantsReturn {
  /**
   * The local participant (self)
   */
  self: Self | null;

  /**
   * List of all remote participants
   */
  participants: Participant[];

  /**
   * Currently pinned participant
   */
  pinnedParticipant?: Participant;

  /**
   * Currently dominant speaker
   */
  dominantSpeaker?: Participant;

  /**
   * List of participants who are either speaking or sharing screen
   */
  activeParticipants: Participant[];

  /**
   * Total number of participants (including self)
   */
  participantCount: number;

  /**
   * Pin a participant's video
   */
  pinParticipant: (participantId: string) => void;

  /**
   * Unpin the currently pinned participant
   */
  unpinParticipant: () => void;

  /**
   * Get a participant by their ID
   */
  getParticipantById: (participantId: string) => Participant | undefined;

  /**
   * Check if a participant is currently speaking
   */
  isParticipantSpeaking: (participantId: string) => boolean;

  /**
   * Check if a participant is sharing their screen
   */
  isParticipantSharingScreen: (participantId: string) => boolean;

  /**
   * Get participants sorted by activity (speaking, sharing screen)
   */
  getSortedParticipants: () => Participant[];
}

export function useParticipants(): UseParticipantsReturn {
  const {
    self,
    participants: participantsMap,
    dominantSpeakerId,
    pinnedParticipantId,
    pinParticipant,
    unpinParticipant,
  } = useCall();

  // Convert participants Map to Array for easier manipulation
  const participants = useMemo(
    () => Array.from(participantsMap.values()),
    [participantsMap]
  );

  // Get pinned participant
  const pinnedParticipant = useMemo(
    () =>
      pinnedParticipantId
        ? participantsMap.get(pinnedParticipantId)
        : undefined,
    [participantsMap, pinnedParticipantId]
  );

  // Get dominant speaker
  const dominantSpeaker = useMemo(
    () =>
      dominantSpeakerId ? participantsMap.get(dominantSpeakerId) : undefined,
    [participantsMap, dominantSpeakerId]
  );

  // Get active participants (speaking or sharing screen)
  const activeParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.id === dominantSpeakerId || participant.screenShareEnabled
      ),
    [participants, dominantSpeakerId]
  );

  // Helper function to get participant by ID
  const getParticipantById = useMemo(
    () => (participantId: string) => participantsMap.get(participantId),
    [participantsMap]
  );

  // Helper function to check if participant is speaking
  const isParticipantSpeaking = useMemo(
    () => (participantId: string) => participantId === dominantSpeakerId,
    [dominantSpeakerId]
  );

  // Helper function to check if participant is sharing screen
  const isParticipantSharingScreen = useMemo(
    () => (participantId: string) => {
      const participant = participantsMap.get(participantId);
      return participant ? participant.screenShareEnabled : false;
    },
    [participantsMap]
  );

  // Get sorted participants based on activity
  const getSortedParticipants = useMemo(
    () => () => {
      const sorted = [...participants];
      sorted.sort((a, b) => {
        // Pinned participant first
        if (a.id === pinnedParticipantId) return -1;
        if (b.id === pinnedParticipantId) return 1;

        // Screen sharing participants next
        if (a.screenShareEnabled && !b.screenShareEnabled) return -1;
        if (!a.screenShareEnabled && b.screenShareEnabled) return 1;

        // Dominant speaker next
        if (a.id === dominantSpeakerId) return -1;
        if (b.id === dominantSpeakerId) return 1;

        // Sort by join time
        return a.joinedAt.getTime() - b.joinedAt.getTime();
      });
      return sorted;
    },
    [participants, pinnedParticipantId, dominantSpeakerId]
  );

  return {
    self,
    participants,
    pinnedParticipant,
    dominantSpeaker,
    activeParticipants,
    participantCount: participants.length + (self ? 1 : 0),
    pinParticipant,
    unpinParticipant,
    getParticipantById,
    isParticipantSpeaking,
    isParticipantSharingScreen,
    getSortedParticipants,
  };
}

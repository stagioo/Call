import { useState, useCallback } from "react";
import { z } from "zod";

const meetingSchema = z.object({
  name: z.string().min(1).max(20).trim(),
  meetingId: z.string().min(1).max(6).optional(),
});

type MeetingData = z.infer<typeof meetingSchema>;

interface UseUnauthenticatedMeetingReturn {
  // Form state
  formData: MeetingData;
  errors: Record<string, string>;
  isLoading: boolean;

  // Actions
  updateFormData: (field: keyof MeetingData, value: string) => void;
  validateForm: () => boolean;
  joinMeeting: (data: MeetingData) => Promise<void>;
  startMeeting: (data: MeetingData) => Promise<void>;

  // Utility
  clearErrors: () => void;
  resetForm: () => void;
}

const MAX_NAME_LENGTH = 20;
const MAX_MEETING_ID_LENGTH = 6;

const validationErrors: Record<string, string> = {
  name: `Name must be less than ${MAX_NAME_LENGTH} characters`,
  meetingId: `Meeting ID must be less than ${MAX_MEETING_ID_LENGTH} characters`,
};

export const useUnauthenticatedMeeting =
  (): UseUnauthenticatedMeetingReturn => {
    const [formData, setFormData] = useState<MeetingData>({
      name: "",
      meetingId: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const updateFormData = useCallback(
      (field: keyof MeetingData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }
      },
      [errors]
    );

    const clearErrors = useCallback(() => {
      setErrors({});
    }, []);

    const resetForm = useCallback(() => {
      setFormData({ name: "", meetingId: "" });
      setErrors({});
    }, []);

    const validateForm = useCallback((): boolean => {
      const newErrors: Record<string, string> = {};

      // Validate name
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      } else if (formData.name.length > MAX_NAME_LENGTH) {
        newErrors.name = validationErrors.name || "";
      }

      // Validate meetingId only if joining (not starting)
      if (
        formData.meetingId &&
        formData.meetingId.length > MAX_MEETING_ID_LENGTH
      ) {
        newErrors.meetingId = validationErrors.meetingId || "";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData]);

    const joinMeeting = useCallback(
      async (data: MeetingData): Promise<void> => {
        if (!validateForm()) return;

        if (!data.meetingId) {
          setErrors((prev) => ({
            ...prev,
            meetingId: "Meeting ID is required to join",
          }));
          return;
        }

        setIsLoading(true);
        try {
          // Extract meeting ID from URL if it's a full URL
          const isUrl = data.meetingId.startsWith("https://");
          let meetingIdOrUrl = data.meetingId;

          if (isUrl) {
            const url = new URL(data.meetingId);
            meetingIdOrUrl = url.pathname.split("/").pop() ?? "";
          }

          if (!meetingIdOrUrl) {
            setErrors((prev) => ({
              ...prev,
              meetingId: validationErrors.meetingId ?? "",
            }));
            return;
          }

          if (meetingIdOrUrl.length > MAX_MEETING_ID_LENGTH) {
            setErrors((prev) => ({
              ...prev,
              meetingId: validationErrors.meetingId ?? "",
            }));
            return;
          }

          // Here you would typically:
          // 1. Navigate to the meeting page
          // 2. Or make an API call to join the meeting
          // 3. Or redirect to the call interface

          console.log("Joining meeting:", {
            name: data.name,
            meetingId: meetingIdOrUrl,
            originalInput: data.meetingId || "",
          });

          // For now, just reset the form
          resetForm();
        } catch (error) {
          console.error("Error joining meeting:", error);
          setErrors((prev) => ({
            ...prev,
            meetingId: "Failed to join meeting",
          }));
        } finally {
          setIsLoading(false);
        }
      },
      [validateForm, resetForm]
    );

    const startMeeting = useCallback(
      async (data: MeetingData): Promise<void> => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
          // Here you would typically:
          // 1. Generate a new meeting ID
          // 2. Navigate to the meeting page
          // 3. Or make an API call to create a meeting
          // 4. Or redirect to the call interface

          console.log("Starting meeting:", {
            name: data.name,
            // Generate a random meeting ID for new meetings
            meetingId: Math.random().toString(36).substring(2, 8).toUpperCase(),
          });

          // For now, just reset the form
          resetForm();
        } catch (error) {
          console.error("Error starting meeting:", error);
          setErrors((prev) => ({ ...prev, name: "Failed to start meeting" }));
        } finally {
          setIsLoading(false);
        }
      },
      [validateForm, resetForm]
    );

    return {
      formData,
      errors,
      isLoading,
      updateFormData,
      validateForm,
      joinMeeting,
      startMeeting,
      clearErrors,
      resetForm,
    };
  };

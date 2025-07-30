"use client";

import { useSession } from "@/components/providers/session";
import { authClient } from "@call/auth/auth-client";
import { Button } from "@call/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call/ui/components/card";
import { Input } from "@call/ui/components/input";
import { Label } from "@call/ui/components/label";
import { UserProfile } from "@call/ui/components/use-profile";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ name }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      await authClient.getSession();

      toast.success("Profile updated successfully");
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-profile-image`,
        {
          method: "PATCH",
          credentials: "include",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update profile image");
      }

      // Refresh the session to get the updated user data
      await authClient.getSession();

      toast.success("Profile image updated successfully");

      // Force a page refresh to update all components with new session data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update profile image");
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="group relative">
              <UserProfile name={user.name} url={user.image} />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={imageLoading}
              />
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <div className="mt-1 flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                  <Button onClick={handleUpdateProfile} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setName(user.name);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm">{user.name}</p>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm">{user.email}</p>
                {user.emailVerified ? (
                  <span className="text-xs font-medium text-green-600">
                    Verified
                  </span>
                ) : (
                  <Button variant="outline" size="sm">
                    Verify Email
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Account Created</Label>
              <p className="mt-1 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

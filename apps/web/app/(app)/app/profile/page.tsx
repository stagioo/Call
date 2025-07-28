"use client";

import { useSession } from "@/hooks/useSession";
import { Card, CardContent, CardHeader, CardTitle } from "@call/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@call/ui/components/avatar";
import { Label } from "@call/ui/components/label";
import { Input } from "@call/ui/components/input";
import { Button } from "@call/ui/components/button";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { authClient } from "@call/auth/auth-client";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const { session, isLoading } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      // Refresh the session to get the updated user data
      await authClient.getSession();
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      
      // Force a page refresh to update all components with new session data
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

      const res = await fetch(`http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-profile-image`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

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
    <div className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 cursor-pointer transition-opacity group-hover:opacity-75" onClick={handleImageClick}>
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback>
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={imageLoading}
              />
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{session.user.name}</h2>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
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
                      setName(session.user.name);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm">{session.user.name}</p>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm">{session.user.email}</p>
                {session.user.emailVerified ? (
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                ) : (
                  <Button variant="outline" size="sm">
                    Verify Email
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Account Created</Label>
              <p className="text-sm mt-1">
                {new Date(session.user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
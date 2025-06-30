"use client";

import { Button } from "@call/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@call/ui/components/form";
import { Input } from "@call/ui/components/input";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1).trim().max(20),
});

const CreateRoom = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{
    id: string;
    name: string;
    joinCode: string;
    createdAt: string;
  } | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/api/room/create", values);

      if (res.data.success) {
        setCreatedRoom(res.data.room);
        form.reset();

        setTimeout(() => {
          router.push(`/r/${res.data.room.id}`);
        }, 2000);
      } else {
        console.error("Error creating room:", res.data.message);
      }
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (createdRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md p-6 bg-background rounded-lg border">
          <h1 className="text-2xl font-bold mb-4 text-center">Room Created!</h1>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Room Name:</p>
              <p className="font-semibold">{createdRoom.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Access Code:</p>
              <p className="font-mono text-lg font-bold bg-muted p-2 rounded text-center">
                {createdRoom.joinCode}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Room ID:</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">
                {createdRoom.id}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Redirecting to the room in 2 seconds...
              </p>
              <Button
                className="w-full"
                onClick={() => router.push(`/r/${createdRoom.id}`)}
              >
                Go now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-4 bg-background rounded-lg border">
        <h1 className="text-2xl font-bold mb-4">Create Room</h1>
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Room Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Room"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;

"use client";

import { Button } from "@call/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@call/ui/components/form";
import { Input } from "@call/ui/components/input";
import { z } from "zod";

import { apiClient } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  name: z.string().min(1).trim().max(20),
});

const CreateRoom = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const res = await apiClient.post("/room/create", values);

    console.log(res);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-4 bg-white rounded-lg border">
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
                      <Input placeholder="Room name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full">Create Room</Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;

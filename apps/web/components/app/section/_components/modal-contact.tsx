"use client";

import { Card, CardContent, CardFooter } from "@call/ui/components/card";

import { Input } from "@call/ui/components/input";
import { Button } from "@call/ui/components/button";
import { Label } from "@call/ui/components/label";

export function ModalContact({ onClose }: { onClose?: () => void }) {
  return (
    <Card className="w-full w-lg">
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" className="w-full">
          Send
        </Button>
        <Button variant="outline" className="w-full" onClick={onClose}>
          close
        </Button>
      </CardFooter>
    </Card>
  );
}

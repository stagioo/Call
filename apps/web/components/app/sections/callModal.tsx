import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@call/ui/components/card";
import { Button } from "@call/ui/components/button";
import React from "react";

interface CallModalProps {
  open: boolean;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-md mx-auto">
        <Card>
          <CardContent>
            <Button className="mt-4" onClick={onClose}>
              Close it
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallModal;

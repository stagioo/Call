import { Button } from "@call/ui/components/button";

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-24">
      <header className="text-center">
        <h1 className="text-4xl font-bold">Welcome to Call</h1>
        <p className="text-lg text-muted-foreground">The open-source alternative to Google Meet and Zoom.</p>
      </header>
      <div className="mt-8">
        <Button>Get Started</Button>
      </div>
    </main>
  );
}
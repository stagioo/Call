import DemoDashboard from "./_components/demo-dashboard";
import HeroWithForm from "./_components/hero-with-form";

export default function Page() {
  return (
    <main className="bg-muted dark:bg-background relative z-0 flex min-h-screen flex-col">
      <HeroWithForm />
      <DemoDashboard />
    </main>
  );
}

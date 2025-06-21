import HeroWithForm from "./_components/hero-with-form";
import Navbar from "./_components/navbar";

export default function Page() {
  return (
    <main className="min-h-screen bg-muted relative z-0">
      <Navbar />
      <HeroWithForm />

      <div className="absolute inset-0 max-w-5xl w-full mx-auto bg-transparent pointer-events-none -z-10 border-x border-border" />
    </main>
  );
}

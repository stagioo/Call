import HeroWithForm from "./_components/hero-with-form";
import Navbar from "./_components/navbar";
import Community from "./_components/community";
import Footer from "./_components/footer";

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col bg-muted dark:bg-background relative z-0">
      <Navbar />
      <HeroWithForm />
      <Community />
      <Footer />
      <div className="absolute inset-0 max-w-5xl w-full mx-auto bg-transparent pointer-events-none -z-10 border-x border-border dark:border-white/5" />
    </main>
  );
}

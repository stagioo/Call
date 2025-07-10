import HeroWithForm from "./_components/hero-with-form";
import Navbar from "./_components/navbar";
import DemoDashboard from "./_components/demo-dashboard";
import Footer from "./_components/footer";

export default function Page() {
  return (
    <main className="bg-muted dark:bg-background relative z-0 flex min-h-screen flex-col">
      <Navbar />
      <HeroWithForm />
      <DemoDashboard />
      <Footer />
      <div className="border-border pointer-events-none absolute inset-0 -z-10 mx-auto w-full max-w-5xl border-x bg-transparent dark:border-white/5" />
    </main>
  );
}

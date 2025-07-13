import React from "react";
import Navbar from "./_components/navbar";
import Footer from "./_components/footer";

const MarkdownLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="bg-muted dark:bg-background relative z-0 flex min-h-screen flex-col">
      <Navbar />
      {children}
      <Footer />
      <div className="border-border pointer-events-none fixed inset-0 mx-auto w-full max-w-5xl border-x bg-transparent h-screen dark:border-white/5 pointer-events-none" />
    </main>
  );
};

export default MarkdownLayout;

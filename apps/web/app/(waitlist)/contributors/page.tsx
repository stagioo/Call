import type { Metadata } from "next";
import Navbar from "../_components/navbar";
import type { Contributor } from "@/lib/types";
import Link from "next/link";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@call/ui/components/avatar";
import { SquareDot } from "@call/ui/components/square-dot";
import { Button } from "@call/ui/components/button";

export const metadata: Metadata = {
  title: "Contributors of Call",
  description: "Meet the amazing contributors who make Call possible",
};

async function getContributors(): Promise<Contributor[]> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/joincalldotco/Call/contributors",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Call-Web-App",
        },
        next: { revalidate: 600 },
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch contributors");
      return [];
    }

    const contributors = (await response.json()) as Contributor[];

    const filteredContributors = contributors.filter(
      (contributor: Contributor) => contributor.type === "User"
    );

    return filteredContributors;
  } catch (error) {
    console.error("Error fetching contributors:", error);
    return [];
  }
}

export default async function Contributors() {
  const contributors = await getContributors();
  const topContributors = contributors.slice(0, 2);
  const otherContributors = contributors.slice(2);

  return (
    <main className="min-h-screen gap-16 flex flex-col bg-muted dark:bg-background relative z-0">
      <Navbar />

      {/* Top 2 Contributors */}
      {topContributors.length > 0 && (
        <div className="max-w-5xl w-full mx-auto px-6 flex items-center justify-center flex-col relative gap-12 pt-20">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <h1 className="text-4xl font-bold font-lora text-primary/90">Top Contributors</h1>
            <p className="text-lg text-muted-foreground max-w-md">
              The developers who have made the most significant contributions to Call
            </p>
          </div>
          <div className="flex flex-row gap-8 w-full justify-center">
            {topContributors.map((contributor) => (
              <Link
                key={contributor.id}
                href={contributor.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-6 w-full max-w-sm rounded-3xl bg-background px-8 py-8  border border-border hover:border-ring dark:border-white/10 dark:hover:border-white/10 transition-all duration-300 "
              >
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={contributor.avatar_url}
                    alt={`${contributor.login}'s avatar`}
                  />
                  <AvatarFallback className="font-medium text-lg">
                    {contributor.login.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center justify-center gap-2">
                  <p className="text-lg font-semibold text-primary/90">
                    {contributor.login}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contributor.contributions} contributions
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px w-full bg-border dark:bg-white/5 max-w-lg mx-auto flex items-center justify-center gap-2 relative">
        <SquareDot />
        <SquareDot position="bottomRight" />
      </div>

      {/* Other Contributors */}
      <div className="max-w-6xl w-full mx-auto px-6 flex items-center justify-center flex-col relative gap-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold font-lora text-primary/90">The Call Community</h2>
          <p className="text-base text-muted-foreground max-w-md">
            Every contribution matters. Meet the community behind Call.
          </p>
        </div>
        
        {otherContributors.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
            {otherContributors.map((contributor) => (
              <Link
                key={contributor.id}
                href={contributor.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-3 p-4 rounded-xl  transition-colors duration-200 group"
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={contributor.avatar_url}
                    alt={`${contributor.login}'s avatar`}
                  />
                  <AvatarFallback className="text-sm font-medium">
                    {contributor.login.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary/80 truncate w-full group-hover:text-primary/90 transition-colors">
                    {contributor.login}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contributor.contributions}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="max-w-2xl w-full mx-auto px-6 flex items-center justify-center flex-col relative gap-8 pb-20">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <h3 className="text-2xl font-bold font-lora text-primary/90">Ready to Contribute?</h3>
          <p className="text-base text-muted-foreground max-w-md">
            Start building the future of meetings with us.
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild size="lg" className="rounded-xl">
            <Link href="https://github.com/joincalldotco/Call" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link href="/" target="_blank" rel="noopener noreferrer">
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute inset-0 max-w-5xl w-full mx-auto bg-transparent pointer-events-none -z-10 border-x border-border dark:border-white/5" />
    </main>
  );
}

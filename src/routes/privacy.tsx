import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-extras";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
  head: () => ({
    meta: [
      { title: "Privacy Policy — LitLingo AI" },
      { name: "description", content: "How LitLingo AI collects, uses, and protects your data, including cookies and advertising." },
      { property: "og:title", content: "Privacy Policy — LitLingo AI" },
      { property: "og:description", content: "How LitLingo AI handles your account data, study content, cookies, and ads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Privacy() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto max-w-3xl flex-1 space-y-4 px-6 py-12 leading-relaxed">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        <h1 className="font-serif text-4xl font-semibold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        <h2 className="font-serif text-2xl font-semibold">Information we collect</h2>
        <p>When you create an account we store your name, email address, and sign-up date. We also store the text you submit to our study tools, your chat history, and quiz results.</p>
        <h2 className="font-serif text-2xl font-semibold">How we use it</h2>
        <p>Your information is used to run your account, provide AI study features, and save your progress. Text you submit is sent to an AI model to generate a response. We do not sell your personal information.</p>
        <h2 className="font-serif text-2xl font-semibold">Cookies and advertising</h2>
        <p>We may show ads served by Google AdSense. Google and its partners use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising at <a className="underline" href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">Google Ads Settings</a>, or learn more at <a className="underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">policies.google.com/technologies/ads</a>.</p>
        <h2 className="font-serif text-2xl font-semibold">Data security and deletion</h2>
        <p>Your data is protected so only you can access your own account content. You may request deletion of your account and data at any time by contacting us.</p>
        <h2 className="font-serif text-2xl font-semibold">Children</h2>
        <p>LitLingo AI is intended for students aged 13 and over.</p>
        <h2 className="font-serif text-2xl font-semibold">Contact</h2>
        <p>For privacy questions, contact the LitLingo AI team through the email address listed on our store page.</p>
      </main>
      <SiteFooter />
    </div>
  );
}

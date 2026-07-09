import Link from "next/link";

export default function SecondaryHeroSection() {
  return (
    <section className="w-full min-h-screen px-6 flex flex-col items-center justify-center text-center bg-white">
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-3xl leading-tight">
        Your treatment shouldn&apos;t cost 10&times; more because of where you
        live.
      </h2>

      <p className="mt-5 text-lg md:text-xl text-gray-500 max-w-xl">
        Get a free, honest estimate in one conversation.
      </p>

      <Link
        href="/chatbox"
        className="mt-8 inline-block bg-black text-white text-base font-medium px-8 py-4 rounded-full hover:bg-gray-800 transition-colors"
      >
        Talk to the AI — it&apos;s free
      </Link>
    </section>
  );
}

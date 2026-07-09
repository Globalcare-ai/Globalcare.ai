export default function FooterSection() {
  return (
    <footer className="border-t border-slate-100 px-6 py-8 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-slate-400 sm:flex-row">
        <span>© 2026 GlobalCare.ai — built for the hackathon</span>
        <span>
          Plane model:{" "}
          <a
            href="https://sketchfab.com/vendol21"
            target="_blank"
            rel="nofollow noreferrer"
            className="text-slate-500 hover:text-blue-600"
          >
            chroma3d on Sketchfab
          </a>
        </span>
      </div>
    </footer>
  );
}

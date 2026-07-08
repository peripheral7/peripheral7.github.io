import Image from "next/image"

const nav = ["Research", "Photography", "Motorcycles", "Index"]

export function SiteHero() {
  return (
    <header className="relative min-h-[100svh] w-full overflow-hidden bg-foreground text-background">
      {/* full-bleed photograph */}
      <Image
        src="/images/hero-terrain.png"
        alt="Aerial photograph of rugged terrain and farmland parcels in raking golden light"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-80"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/30 to-foreground/85"
      />

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-background/70">
            No. 037
          </span>
          <span className="h-3 w-px bg-background/40" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-background/70">
            Field File
          </span>
        </div>
        <nav className="hidden gap-7 md:flex">
          {nav.map((item) => (
            <a
              key={item}
              href="#board"
              className="font-mono text-xs uppercase tracking-[0.2em] text-background/80 underline-offset-8 transition-colors hover:text-background hover:underline"
            >
              {item}
            </a>
          ))}
        </nav>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent-foreground bg-accent px-2 py-1">
          Classified · Open
        </span>
      </div>

      {/* title block */}
      <div className="relative z-10 flex min-h-[calc(100svh-160px)] flex-col justify-center px-5 md:px-10">
        <p className="mb-6 max-w-md font-mono text-xs uppercase leading-relaxed tracking-[0.25em] text-background/70">
          A working notebook — evidence collected across three ongoing lines of inquiry.
        </p>
        <h1 className="text-balance font-sans text-[15vw] font-black uppercase leading-[0.85] tracking-tight md:text-[11vw] lg:text-[9.5rem]">
          The Field
          <br />
          File
        </h1>
        <div className="mt-8 flex max-w-2xl flex-col gap-4 border-t border-background/25 pt-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-pretty text-sm leading-relaxed text-background/85">
            Land evaluation research, photographs, and machines. Filed without
            order, pinned to the board, and left for cross-reference.
          </p>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-background/60">
            Scroll to the board ↓
          </span>
        </div>
      </div>

      {/* filing tabs along bottom */}
      <div className="relative z-10 flex flex-wrap gap-2 px-5 pb-6 md:px-10">
        {["Land Evaluation", "Photography", "Motorcycles"].map((tab, i) => (
          <span
            key={tab}
            className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-background/85"
            style={{ opacity: 0.6 + i * 0.15 }}
          >
            <span className="mr-2 text-accent">◆</span>
            {tab}
          </span>
        ))}
      </div>
    </header>
  )
}

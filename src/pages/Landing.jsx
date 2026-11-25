import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion, useReducedMotion } from "framer-motion";

import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Search,
  Navigation,
  Clock3,
  ShieldCheck,
  MapPinned,
  Crosshair,
  Compass,
} from "lucide-react";



const sectionReveal = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemReveal = {
  hidden: {
    opacity: 0,
    y: 22,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const isDark = useSelector((state) => state.app.theme) === "dark";

  const theme = {
    text: isDark ? "text-[#F8FAFC]" : "text-[#18364A]",
    muted: isDark ? "text-[#A7B5C8]" : "text-[#718A9B]",
    subtle: isDark ? "text-[#8294AA]" : "text-[#8297A6]",

    surface: isDark ? "bg-[#1B293B]" : "bg-white",
    surfaceAlt: isDark ? "bg-[#101827]" : "bg-[#F5F9FB]",

    border: isDark ? "border-[#33465C]" : "border-[#DCE5EC]",

    accent: isDark
      ? "bg-[#20C7C2] text-[#101827] hover:bg-[#3ADBD5]"
      : "bg-[#087F9B] text-white hover:bg-[#066A82]",

    accentText: isDark ? "text-[#20C7C2]" : "text-[#087F9B]",

    iconSurface: isDark
      ? "bg-[#243449] text-[#20C7C2]"
      : "bg-[#DDF1F5] text-[#087F9B]",
  };

  const steps = [
    {
      number: "01",
      icon: Search,
      title: "Search your location",
      description:
        "Enter a location or use your current location to begin finding nearby pharmacies.",
    },
    {
      number: "02",
      icon: MapPin,
      title: "Explore nearby pharmacies",
      description:
        "Explore pharmacy locations, available contact information, opening hours, and map details.",
    },
    {
      number: "03",
      icon: Navigation,
      title: "Choose your route",
      description:
        "Open a pharmacy, compare available routes, and choose how to reach your destination.",
    },
  ];

  const features = [
    {
      icon: MapPinned,
      title: "Location-based discovery",
      description:
        "Find pharmacies around a searched location or your current position.",
    },
    {
      icon: Clock3,
      title: "Pharmacy information",
      description:
        "Check available opening hours, phone numbers, websites, and location details.",
    },
    {
      icon: Navigation,
      title: "Route alternatives",
      description: "Explore different route options to your selected pharmacy.",
    },
    {
      icon: ShieldCheck,
      title: "Emergency access",
      description:
        "Quickly access the emergency information available in RxNear.",
    },
  ];

  const openFinder = () => {
    navigate("/finder");
  };

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const reveal = shouldReduceMotion
    ? {}
    : {
        initial: "hidden",
        whileInView: "visible",
        viewport: {
          once: true,
          amount: 0.15,
        },
      };

  return (
    <main className={`overflow-hidden ${theme.text}`}>
      {/* HERO */}

      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div
          className={[
            "relative isolate mx-auto max-w-[1600px]",
            "min-h-[590px] overflow-hidden rounded-[24px]",
            "border sm:min-h-[670px] sm:rounded-[30px]",
            theme.border,
            isDark ? "bg-[#101827]" : "bg-[#DDF1F5]",
          ].join(" ")}
        >
          {/* BACKGROUND MAP */}

          <img
            src="/staticmap.jpg"
            alt="Geographical map used as the RxNear landing page background"
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />

          {/* MAP OVERLAY */}

          <div
            aria-hidden="true"
            className={[
              "absolute inset-0",
              isDark ? "bg-[#101827]/75" : "bg-[#18364A]/45",
            ].join(" ")}
          />

          <div
            aria-hidden="true"
            className={[
              "absolute inset-0",
              isDark
                ? "bg-gradient-to-b from-[#101827]/25 via-[#101827]/45 to-[#101827]/95"
                : "bg-gradient-to-b from-[#18364A]/10 via-[#18364A]/30 to-[#18364A]/80",
            ].join(" ")}
          />

          {/* HERO CONTENT */}

          <div className="relative z-10 flex min-h-[590px] flex-col justify-between p-5 sm:min-h-[670px] sm:p-9 lg:p-12">
            {/* TOP BAR */}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-[#101827]/30 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md">
                <MapPin size={16} />
                <span>Your pharmacy finder</span>
              </div>

              <span className="hidden items-center gap-2 rounded-full border border-white/25 bg-[#101827]/30 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white/90 backdrop-blur-md sm:inline-flex">
                FIND
                <span className="text-white/50">/</span>
                EXPLORE
                <span className="text-white/50">/</span>
                NAVIGATE
              </span>
            </div>

            {/* MAIN CONTENT */}

            <motion.div
              className="mx-auto w-full max-w-5xl py-16 text-center sm:py-20"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-white/80 sm:text-sm">
                Healthcare access, made easier
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Find Pharmacies
                <span className="mt-3 block font-light tracking-tight">
                  When You Need It Most.
                </span>
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
                Discover nearby pharmacies, explore their information, and find
                routes to help you reach your destination.
              </p>

              {/* HERO ACTIONS */}

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openFinder}
                  className={[
                    "group inline-flex min-h-12 w-full items-center",
                    "justify-center gap-3 rounded-xl px-7 py-4",
                    "text-sm font-bold shadow-lg",
                    "transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-white focus-visible:ring-offset-2",
                    "focus-visible:ring-offset-[#101827]",
                    "sm:w-auto",
                    theme.accent,
                  ].join(" ")}
                >
                  <Search size={19} />
                  Find a Pharmacy
                  <ArrowRight
                    size={18}
                    className={
                      shouldReduceMotion
                        ? ""
                        : "transition-transform duration-200 group-hover:translate-x-1"
                    }
                  />
                </button>

                <button
                  type="button"
                  onClick={scrollToHowItWorks}
                  className={[
                    "inline-flex min-h-12 w-full items-center",
                    "justify-center gap-2 rounded-xl",
                    "border border-white/40 bg-white/10",
                    "px-7 py-4 text-sm font-semibold text-white",
                    "backdrop-blur-md transition-colors duration-200",
                    "hover:bg-white/20",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-white focus-visible:ring-offset-2",
                    "focus-visible:ring-offset-[#101827]",
                    "sm:w-auto",
                  ].join(" ")}
                >
                  How it works
                  <ArrowRight size={17} />
                </button>
              </div>
            </motion.div>

            {/* HERO FOOTER */}

            <div className="flex flex-col justify-between gap-4 border-t border-white/25 pt-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5 text-sm text-white/90">
                <Crosshair size={17} className="shrink-0" />
                <span>Search using a location or your current position</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-white/75">
                <Compass size={16} />
                EXPLORE WITH RXNEAR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section
        id="how-it-works"
        className="scroll-mt-28 px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="mx-auto max-w-7xl">
          {/* SECTION INTRO */}

          <motion.div
            className="mx-auto max-w-2xl text-center"
            variants={sectionReveal}
            {...reveal}
          >
            <p
              className={[
                "text-xs font-bold uppercase tracking-[0.24em]",
                theme.accentText,
              ].join(" ")}
            >
              Simple by design
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              How RxNear works
            </h2>

            <p className={`mt-5 text-sm leading-7 sm:text-base ${theme.muted}`}>
              Finding a pharmacy shouldn't be complicated. Follow three simple
              steps to discover a pharmacy and explore how to get there.
            </p>
          </motion.div>

          {/* STEP CARDS */}

          <motion.div
            className="mt-14 grid gap-5 md:grid-cols-3"
            variants={staggerContainer}
            {...reveal}
          >
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  variants={itemReveal}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -5,
                          transition: { duration: 0.2 },
                        }
                  }
                  className={[
                    "group relative overflow-hidden rounded-2xl",
                    "border p-6 sm:p-7",
                    "transition-shadow duration-200 hover:shadow-xl",
                    theme.surface,
                    theme.border,
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={[
                        "flex h-12 w-12 items-center justify-center",
                        "rounded-xl",
                        theme.iconSurface,
                      ].join(" ")}
                    >
                      <Icon size={23} strokeWidth={2} />
                    </div>

                    <span
                      className={[
                        "text-3xl font-light tracking-tight",
                        isDark ? "text-[#33465C]" : "text-[#DCE5EC]",
                      ].join(" ")}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-7 text-xl font-bold tracking-tight">
                    {step.title}
                  </h3>

                  <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>
                    {step.description}
                  </p>

                  <div
                    aria-hidden="true"
                    className={[
                      "absolute bottom-0 left-0 h-1 w-0",
                      "transition-all duration-300",
                      "group-hover:w-full",
                      isDark ? "bg-[#20C7C2]" : "bg-[#087F9B]",
                    ].join(" ")}
                  />
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}

      <section
        className={[
          "border-y",
          theme.border,
          isDark ? "bg-[#1B293B]" : "bg-[#EDF5F8]",
        ].join(" ")}
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* LEFT INTRODUCTION */}

          <motion.div variants={sectionReveal} {...reveal}>
            <p
              className={[
                "text-xs font-bold uppercase tracking-[0.24em]",
                theme.accentText,
              ].join(" ")}
            >
              Designed around your needs
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              More than finding a place on the map.
            </h2>

            <p className={`mt-5 max-w-lg text-sm leading-8 ${theme.muted}`}>
              RxNear brings pharmacy discovery, useful pharmacy information, and
              route exploration together in one straightforward experience.
            </p>

            <button
              type="button"
              onClick={openFinder}
              className={[
                "group mt-8 inline-flex min-h-12 items-center",
                "gap-3 rounded-xl px-6 py-3.5",
                "text-sm font-bold transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-offset-2",
                theme.accent,
                isDark
                  ? "focus-visible:ring-[#20C7C2] focus-visible:ring-offset-[#1B293B]"
                  : "focus-visible:ring-[#087F9B] focus-visible:ring-offset-[#EDF5F8]",
              ].join(" ")}
            >
              Explore RxNear
              <ArrowUpRight
                size={18}
                className={
                  shouldReduceMotion
                    ? ""
                    : "transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                }
              />
            </button>
          </motion.div>

          {/* FEATURE CARDS */}

          <motion.div
            className="grid gap-4 sm:grid-cols-2"
            variants={staggerContainer}
            {...reveal}
          >
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  variants={itemReveal}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: -4,
                          transition: { duration: 0.2 },
                        }
                  }
                  className={[
                    "rounded-2xl border p-5 sm:p-6",
                    "transition-shadow duration-200 hover:shadow-lg",
                    theme.surface,
                    theme.border,
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-11 w-11 items-center justify-center",
                      "rounded-xl",
                      theme.iconSurface,
                    ].join(" ")}
                  >
                    <Icon size={21} strokeWidth={2} />
                  </div>

                  <h3 className="mt-5 text-base font-bold tracking-tight">
                    {feature.title}
                  </h3>

                  <p className={`mt-2 text-sm leading-6 ${theme.muted}`}>
                    {feature.description}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <motion.div
          className={[
            "relative mx-auto max-w-7xl overflow-hidden",
            "rounded-[24px] border px-6 py-14 text-center",
            "sm:rounded-[30px] sm:px-12 sm:py-20",
            theme.surface,
            theme.border,
          ].join(" ")}
          variants={sectionReveal}
          {...reveal}
        >
          {/* DECORATIVE ACCENT */}

         

          <div
            className={[
              "mx-auto flex h-14 w-14 items-center justify-center",
              "rounded-2xl",
              theme.iconSurface,
            ].join(" ")}
          >
            <MapPin size={27} />
          </div>

          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Your next pharmacy is just a search away.
          </h2>

          <p
            className={`mx-auto mt-5 max-w-xl text-sm leading-7 ${theme.muted}`}
          >
            Start exploring pharmacies around your selected location with
            RxNear.
          </p>

          <button
            type="button"
            onClick={openFinder}
            className={[
              "group mt-8 inline-flex min-h-12 items-center",
              "justify-center gap-3 rounded-xl px-7 py-4",
              "text-sm font-bold transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-offset-2",
              theme.accent,
              isDark
                ? "focus-visible:ring-[#20C7C2] focus-visible:ring-offset-[#1B293B]"
                : "focus-visible:ring-[#087F9B] focus-visible:ring-offset-white",
            ].join(" ")}
          >
            <Search size={18} />
            Find Pharmacies
            <ArrowRight
              size={18}
              className={
                shouldReduceMotion
                  ? ""
                  : "transition-transform duration-200 group-hover:translate-x-1"
              }
            />
          </button>
        </motion.div>
      </section>
    </main>
  );
}

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSelector } from "react-redux";

const messages = [
  "Search Location",
  "Grant Us Location",
  "Find Pharmacy Near You",
  "Search Location on Input Bar",
  "Call Emergency Numbers in Need",
];

export default function IdleAnimation() {
  const [messageIndex, setMessageIndex] = useState(0);

  const theme = useSelector((state) => state.app.theme);
  const isDark = theme === "dark";

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, []);

  const bubbleTheme = isDark
    ? "border-[#33465C] bg-[#1B293B] text-[#F8FAFC] shadow-black/20"
    : "border-[#DCE5EC] bg-white text-[#18364A] shadow-[#18364A]/10";

  const mutedTheme = isDark ? "text-[#A7B5C8]" : "text-[#718A9B]";

  return (
    <section
      aria-label="RxNear pharmacist assistant"
      className="relative mx-auto flex min-h-[390px] w-full max-w-md flex-col items-center justify-end gap-3 overflow-visible px-3 pt-6 pb-5 max-[480px]:min-h-[330px]"
    >
      {/* SPEECH BUBBLE */}
      <div className="absolute top-0 left-1/2 z-10 flex min-h-[85px] w-[min(340px,90%)] -translate-x-1/2 items-end justify-center max-[480px]:w-[95%]">
        <AnimatePresence mode="wait">
          <motion.div
            key={messageIndex}
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.8, y: 14, rotate: -2 }
            }
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: 0,
            }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.9, y: -9 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.35,
              ease: "easeOut",
            }}
            className={[
              "relative flex min-h-[66px] w-fit min-w-[190px]",
              "max-w-full items-center justify-center rounded-[20px]",
              "border-[1.5px] px-[23px] py-[17px]",
              "text-center shadow-lg transition-colors duration-300",
              "max-[480px]:px-[17px] max-[480px]:py-[13px]",
              bubbleTheme,
            ].join(" ")}
          >
            <motion.p
              initial={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 5 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.3,
                delay: shouldReduceMotion ? 0 : 0.1,
              }}
              className="text-[clamp(13px,2.5vw,16px)] font-semibold leading-relaxed"
            >
              {messages[messageIndex]}
            </motion.p>

            <span
              aria-hidden="true"
              className={[
                "absolute -bottom-[9px] left-1/2 h-[17px] w-[17px]",
                "-translate-x-1/2 rotate-45 border-b border-r",
                bubbleTheme,
              ].join(" ")}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* PHARMACIST CHARACTER */}
      <motion.div
        className="relative mt-[90px] flex w-[min(280px,75vw)] origin-bottom items-end justify-center max-[480px]:mt-[85px] max-[480px]:w-[min(230px,72vw)]"
        animate={shouldReduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
        transition={{
          duration: 3,
          repeat: shouldReduceMotion ? 0 : Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src="/pharmacist.svg"
          alt="RxNear pharmacist assistant"
          draggable="false"
          className="block h-auto w-full select-none object-contain"
        />
      </motion.div>

      {/* ASSISTANT LABEL */}
      <p
        className={[
          "text-[10px] font-bold uppercase tracking-[2px]",
          mutedTheme,
        ].join(" ")}
      >
        RxNear Assistant
      </p>
    </section>
  );
}

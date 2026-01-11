"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function TrafficLightTransition() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const isFirstRenderRef = useRef(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // visibility of overlay
  const [visible, setVisible] = useState(false);
  // 0 = red, 1 = yellow, 2 = green
  const [step, setStep] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    // 清除上次计时器
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }

    // 首次渲染：显示交通灯
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevPathRef.current = pathname;
      setVisible(true);
      setStep(0);
      stepTimerRef.current = setTimeout(() => {
        setStep(1);
        stepTimerRef.current = setTimeout(() => {
          setStep(2);
          hideTimerRef.current = setTimeout(() => {
            setVisible(false);
          }, 250);
        }, 350);
      }, 350);
      return () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
        hideTimerRef.current = null;
        stepTimerRef.current = null;
      };
    }

    // 非首次：统一显示交通灯
    setVisible(true);
    setStep(0);
    stepTimerRef.current = setTimeout(() => {
      setStep(1);
      stepTimerRef.current = setTimeout(() => {
        setStep(2);
        hideTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, 250);
      }, 350);
    }, 350);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      hideTimerRef.current = null;
      stepTimerRef.current = null;
    };
  }, [pathname]);
  useEffect(() => {
    prevPathRef.current = pathname;
  }, [pathname]);

  const lightCommon =
    "w-6 h-6 md:w-8 md:h-8 rounded-full transition-colors duration-200";

  const redActive = step === 0;
  const yellowActive = step === 1;
  const greenActive = step === 2;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="pointer-events-none fixed inset-0 z-[100] bg-black/50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, y: 6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.98, y: 4 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="pointer-events-none flex flex-col items-center gap-3"
          >
            <div className="rounded-md border border-zinc-700 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className={lightCommon}
                  animate={{
                    backgroundColor: redActive ? "#ef4444" : "#3f3f46",
                    boxShadow: redActive
                      ? "0 0 12px rgba(239,68,68,0.75)"
                      : "0 0 0 rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.2 }}
                />
                <motion.div
                  className={lightCommon}
                  animate={{
                    backgroundColor: yellowActive ? "#f59e0b" : "#3f3f46",
                    boxShadow: yellowActive
                      ? "0 0 12px rgba(245,158,11,0.75)"
                      : "0 0 0 rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.2 }}
                />
                <motion.div
                  className={lightCommon}
                  animate={{
                    backgroundColor: greenActive ? "#22c55e" : "#3f3f46",
                    boxShadow: greenActive
                      ? "0 0 12px rgba(34,197,94,0.75)"
                      : "0 0 0 rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="text-xs md:text-sm text-zinc-300"
            >
              Loading…
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



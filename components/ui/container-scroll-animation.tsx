"use client";

import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import React, { useRef } from "react";

interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [8, -8]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div ref={ref} className="relative w-full">
      <Header translate={translate} titleComponent={titleComponent} />
      <Card rotate={rotate} scale={scale} translate={translate}>
        {children}
      </Card>
    </div>
  );
}

export function Header({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) {
  return (
    <motion.div
      style={{ y: translate }}
      className="sticky top-10 z-10 mb-10 flex w-full items-center justify-center"
    >
      {titleComponent}
    </motion.div>
  );
}

export function Card({
  rotate,
  scale,
  translate,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        y: translate,
        transformPerspective: 1000,
      }}
      className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl"
    >
      {children}
    </motion.div>
  );
}



"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { AlertTriangle, Bike, Users, Skull } from "lucide-react";
import type { ClusteredHotspot } from "@/types/collision";

function AnimatedCounter({ value, delay }: { value: number; delay: number }) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const display = useTransform(spring, (current) =>
    Math.round(current)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      motionValue.set(value);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [motionValue, value, delay]);

  return <motion.span>{display}</motion.span>;
}

interface StatsGridProps {
  hotspot: ClusteredHotspot;
}

export function StatsGrid({ hotspot }: StatsGridProps) {
  const stats = [
    {
      label: "Total Collisions",
      value: hotspot.total_count,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
    },
    {
      label: "Fatal",
      value: hotspot.fatal_count,
      icon: Skull,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
    },
    {
      label: "Cyclists",
      value: hotspot.cyclist_count,
      icon: Bike,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Pedestrians",
      value: hotspot.pedestrian_count,
      icon: Users,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            ease: "easeOut"
          }}
          className={`flex items-center gap-3 rounded-lg border border-zinc-800 ${stat.bgColor} p-3`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1 + 0.2,
              ease: "easeOut"
            }}
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </motion.div>
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1 + 0.3,
                ease: "easeOut"
              }}
              className="text-2xl font-bold text-white"
            >
              <AnimatedCounter value={stat.value} delay={index * 0.1 + 0.3} />
            </motion.p>
            <p className="text-xs text-zinc-400">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

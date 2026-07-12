"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MotionCard({ className, ...props }: React.ComponentProps<typeof motion.div>) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(className)}
      {...props}
    />
  );
}

export function MotionButton({ className, ...props }: React.ComponentProps<typeof motion.button>) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.button
      whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(className)}
      {...props}
    />
  );
}

export function MotionListItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn(className)} {...props} />;
}

export function MotionPage({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(className)} {...props} />;
}

export function StaggeredList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn(className)}>{children}</div>;
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Card that lifts on hover with scale + shadow transition */
export function MotionCard({ className, children, ...props }: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Button with press scale feedback */
export function MotionButton({ className, children, ...props }: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/** List item with staggered fade-in */
export function MotionListItem({
  className,
  children,
  index = 0,
  ...props
}: React.ComponentProps<typeof motion.li> & { index?: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.li>
  );
}

/** Page container with fade + slide-up entrance */
export function MotionPage({ className, children, ...props }: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn("", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list wrapper */
export function StaggeredList({
  className,
  children,
  staggerDelay = 0.05,
}: {
  className?: string;
  children: React.ReactNode;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  );
}

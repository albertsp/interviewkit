"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import LevelHero from "@/components/stats/LevelHero";
import StatCards from "@/components/stats/StatCards";
import RecentSessions from "@/components/stats/RecentSessions";
import SavedCardsSummary from "@/components/stats/SavedCardsSummary";
import { PageContainer } from "@/components/layout/PageContainer";
import { containerVariants, itemVariants } from "@/components/layout/motion-variants";

const ResultsDonut = dynamic(() => import("@/components/stats/ResultsDonut"), { ssr: false });
const StackBars = dynamic(() => import("@/components/stats/StackBars"), { ssr: false });

export default function StatsPage() {
  const { stats } = useAuth();

  return (
    <PageContainer max="5xl" className="pb-10">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <LevelHero
            level={stats.level}
            progressInLevel={stats.progress_in_level}
            xpPerLevel={stats.xp_per_level}
            xpToNextLevel={stats.xp_to_next_level}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <StatCards stats={stats} sessionsCount={stats.sessions_count} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <ResultsDonut results={stats.results_summary} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StackBars stacks={stats.stacks_stats} />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <RecentSessions sessions={stats.recent_sessions} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <SavedCardsSummary
            total={stats.cards_summary.total}
            topTags={stats.cards_summary.top_tags}
          />
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
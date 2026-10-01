"use client";
import { useAuth } from "@/context/AuthContext";
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChangeUsernameDialog } from '@/components/profile/ChangeUsernameDialog';
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import StatCards from "@/components/stats/StatCards";
import { containerVariants, itemVariants } from "@/components/layout/motion-variants";


export default function ProfilePage() {
    const { user, stats } = useAuth();
    const [isOpenChangeUserName, setIsOpenChangeUserName] = useState(false);

    const progressPercent = stats.xp_per_level > 0
        ? Math.min(100, (stats.progress_in_level / stats.xp_per_level) * 100)
        : 0;

    const xpToNextLevel = stats.xp_to_next_level || 0;

    return (
        <PageContainer max="5xl">
            <PageHeader title="Perfil" description="Tu cuenta y tu progreso." />
            <ChangeUsernameDialog isOpenChangeUserName={isOpenChangeUserName} setIsOpenChangeUserName={setIsOpenChangeUserName} />
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-6 items-start"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden">
                        <CardContent className="flex flex-col items-center pt-8 pb-6 px-6">
                            <div className="relative">
                                <Avatar className="h-28 w-28 border border-border">
                                    <AvatarFallback className="display text-3xl font-medium bg-secondary text-foreground">
                                        {user?.split(' ').map(n => n[0]).join('') || "U"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <p className="display text-2xl font-medium text-foreground">
                                    {user || "Usuario"}
                                </p>
                                <button onClick={() => setIsOpenChangeUserName(true)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Editar nombre de usuario">
                                    <Pencil className="size-3.5" />
                                </button>
                            </div>

                            <div className="w-full mt-6">
                                <div className="h-2 w-full bg-muted overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
                                    <span>{stats.progress_in_level} / {stats.xp_per_level || '—'} XP</span>
                                    <span>{xpToNextLevel} XP al Nv {stats.level + 1}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3">
                    <h2 className="font-mono text-xs text-muted-foreground">
                        Tu progreso
                    </h2>
                    <StatCards stats={stats} sessionsCount={stats.sessions_count} />
                </motion.div>
            </motion.div>
        </PageContainer>
    );
}

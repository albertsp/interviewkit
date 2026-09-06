"use client";
import { useAuth } from "@/context/AuthContext";
import { motion } from 'framer-motion';
import { Camera, Pencil } from 'lucide-react';
import { useState } from 'react';

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChangeUsernameDialog } from '@/components/profile/ChangeUsernameDialog';
import { PageContainer } from "@/components/layout/PageContainer";
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
                                <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                                    <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                                        {user?.split(' ').map(n => n[0]).join('') || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <label className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors" aria-label="Cambiar foto de perfil">
                                    <Camera className="size-3.5" />
                                    <input type="file" accept="image/*" className="hidden" aria-hidden="true" />
                                </label>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    {user || "Usuario"}
                                </h1>
                                <button onClick={() => setIsOpenChangeUserName(true)} className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Editar nombre de usuario">
                                    <Pencil className="size-3.5" />
                                </button>
                            </div>

                            <div className="w-full mt-6">
                                <div className="h-3 w-full rounded-full bg-amber-500/20 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                                    <span>{stats.progress_in_level} / {stats.xp_per_level || '—'} XP</span>
                                    <span>{xpToNextLevel} XP al Nv {stats.level + 1}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Tu progreso
                    </h2>
                    <StatCards stats={stats} sessionsCount={stats.sessions_count} />
                </motion.div>
            </motion.div>
        </PageContainer>
    );
}

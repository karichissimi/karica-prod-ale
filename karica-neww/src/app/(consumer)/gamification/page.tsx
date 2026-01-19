"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CardWithWatermark } from "@/components/ui/card-watermark";
import { Trophy, Award, Target, TrendingUp, Star, Zap, Users, Wrench, Gamepad2, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConfetti } from "@/hooks/useConfetti";
import { useToast } from "@/hooks/use-toast";
import AnimatedLogo from '@/components/AnimatedLogo';
import { ProgressRing } from "@/components/ui/progress-ring";
import { AchievementCard, AchievementGrid } from "@/components/ui/achievement-card";
import { WipDisclaimer } from "@/components/WipDisclaimer";
import { cn } from "@/lib/utils";

const Gamification = () => {
    const router = useRouter();
    const { fire, fireMultiple, fireStars, fireSides } = useConfetti();
    const { toast } = useToast();

    const quickNavItems = [
        { icon: Home, label: 'Home', path: '/', color: 'bg-primary/10 text-primary' },
        { icon: Users, label: 'CER', path: '/cer', color: 'bg-primary/10 text-primary' },
        { icon: Wrench, label: 'Interventi', path: '/interventions', color: 'bg-accent/10 text-accent' },
    ];

    const userStats = {
        points: 1250,
        level: 5,
        rank: 12,
        achievements: 8,
        nextLevelPoints: 1500,
    };

    const achievements = [
        { id: 1, title: 'Primo Risparmio', description: 'Hai risparmiato energia per la prima volta', earned: true, icon: '🎯' },
        { id: 2, title: 'Settimana Verde', description: 'Risparmio per 7 giorni consecutivi', earned: true, icon: '🌱' },
        { id: 3, title: 'Membro CER', description: 'Entrato in una comunità energetica', earned: true, icon: '👥' },
        { id: 4, title: 'Eco Warrior', description: 'Risparmio del 30% mensile', earned: false, icon: '⚡' },
        { id: 5, title: 'Solar Champion', description: 'Installato pannelli solari', earned: false, icon: '☀️' },
        { id: 6, title: 'Super Saver', description: 'Risparmiato 1000 kWh', earned: true, icon: '💚' },
    ];

    const leaderboard = [
        { rank: 1, name: 'Laura Bianchi', points: 2840, trend: 'up' },
        { rank: 2, name: 'Giuseppe Verdi', points: 2650, trend: 'up' },
        { rank: 3, name: 'Mario Rossi', points: 2420, trend: 'down' },
        { rank: 4, name: 'Anna Russo', points: 1980, trend: 'up' },
        { rank: 5, name: 'Paolo Neri', points: 1750, trend: 'same' },
    ];

    const challenges = [
        { id: 1, title: 'Riduci i Consumi', description: 'Risparmia 10 kWh questa settimana', progress: 65, reward: 100 },
        { id: 2, title: 'Ora di Punta', description: 'Evita i consumi nelle ore di punta per 3 giorni', progress: 33, reward: 150 },
        { id: 3, title: 'Comunità Attiva', description: 'Condividi 20 kWh con la CER', progress: 100, reward: 200 },
    ];

    const progressToNextLevel = ((userStats.points / userStats.nextLevelPoints) * 100);

    const handleAchievementClick = (achievement: typeof achievements[0]) => {
        if (achievement.earned) {
            fireStars();
            toast({
                title: `🏆 ${achievement.title}`,
                description: achievement.description,
            });
        }
    };

    const handleClaimReward = (challenge: typeof challenges[0]) => {
        if (challenge.progress >= 100) {
            fireMultiple('achievement');
            toast({
                title: '🎉 Sfida completata!',
                description: `Hai guadagnato +${challenge.reward} punti!`,
            });
        } else {
            fire('points');
            toast({
                title: '💪 Continua così!',
                description: `Mancano ${100 - challenge.progress}% al completamento`,
            });
        }
    };

    const handleLevelUp = () => {
        fireSides();
        toast({
            title: '⬆️ Prossimo livello!',
            description: `Ti mancano ${userStats.nextLevelPoints - userStats.points} punti`,
        });
    };

    return (
        <div className="space-y-6">
            {/* WIP Disclaimer */}
            <WipDisclaimer storageKey="karica_wip_dismissed_gamification" />

            <div className="flex items-center gap-4 animate-fade-in">
                <AnimatedLogo className="h-12 w-12" />
                <div>
                    <h2 className="text-3xl font-bold">Gamification</h2>
                    <p className="text-muted-foreground">Guadagna punti e sblocca achievement</p>
                </div>
            </div>

            {/* Quick Navigation Badges */}
            <div className="flex flex-wrap gap-2 animate-fade-in stagger-1">
                {quickNavItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 ${item.color}`}
                    >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Level Card with Progress Ring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CardWithWatermark
                    className="p-6 bg-gradient-primary cursor-pointer hover:shadow-elegant transition-all animate-fade-in stagger-2"
                    watermarkPosition="bottom-right"
                    watermarkSize="lg"
                    watermarkOpacity={0.08}
                    onClick={handleLevelUp}
                >
                    <div className="flex items-center gap-6">
                        {/* Progress Ring */}
                        <ProgressRing
                            value={userStats.points}
                            max={userStats.nextLevelPoints}
                            size={100}
                            strokeWidth={8}
                            className="shrink-0"
                        >
                            <div className="text-center">
                                <span className="text-3xl font-bold text-primary-foreground">{userStats.level}</span>
                                <p className="text-[10px] text-primary-foreground/70 uppercase tracking-wide">Livello</p>
                            </div>
                        </ProgressRing>

                        <div className="flex-1">
                            <p className="text-primary-foreground/80 text-sm mb-1">Il Tuo Livello</p>
                            <h3 className="text-2xl font-bold mb-2 text-primary-foreground">Livello {userStats.level}</h3>
                            <p className="text-primary-foreground/80 text-sm">
                                {userStats.points} / {userStats.nextLevelPoints} punti
                            </p>
                            <p className="text-sm text-primary-foreground/60 mt-1">
                                {userStats.nextLevelPoints - userStats.points} punti al prossimo livello
                            </p>
                        </div>
                    </div>
                </CardWithWatermark>

                <div className="grid grid-cols-2 gap-4">
                    <Card variant="glow" className="p-6 animate-fade-in stagger-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-accent/10">
                                <Target className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rank</p>
                                <p className="text-2xl font-bold">#{userStats.rank}</p>
                            </div>
                        </div>
                    </Card>

                    <Card variant="glow" className="p-6 animate-fade-in stagger-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-secondary/10">
                                <Award className="h-6 w-6 text-secondary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Achievement</p>
                                <p className="text-2xl font-bold">{userStats.achievements}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Active Challenges */}
            <Card variant="glass" className="p-6 animate-fade-in stagger-5">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Sfide Attive
                </h3>
                <div className="space-y-4">
                    {challenges.map((challenge, index) => (
                        <div
                            key={challenge.id}
                            className={cn(
                                "p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-md group",
                                challenge.progress >= 100 && "bg-primary/5 border-primary/30"
                            )}
                            onClick={() => handleClaimReward(challenge)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {/* Mini progress ring */}
                                    <ProgressRing
                                        value={challenge.progress}
                                        max={100}
                                        size={44}
                                        strokeWidth={4}
                                        showValue={false}
                                        glow={false}
                                    >
                                        <span className="text-xs font-bold">{challenge.progress}%</span>
                                    </ProgressRing>
                                    <div>
                                        <h4 className="font-semibold">{challenge.title}</h4>
                                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                    </div>
                                </div>
                                <Badge className={cn(
                                    "gap-1 transition-all",
                                    challenge.progress >= 100 && "bg-primary animate-glow-pulse"
                                )}>
                                    <Star className="h-3 w-3" />
                                    +{challenge.reward}
                                </Badge>
                            </div>
                            {challenge.progress >= 100 && (
                                <Button size="sm" className="w-full mt-2 group-hover:animate-bounce-soft">
                                    🎁 Riscatta Ricompensa
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Achievements */}
                <Card variant="glass" className="p-6 animate-fade-in">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        I Tuoi Achievement
                    </h3>
                    <AchievementGrid>
                        {achievements.map((achievement) => (
                            <AchievementCard
                                key={achievement.id}
                                icon={achievement.icon}
                                title={achievement.title}
                                description={achievement.description}
                                earned={achievement.earned}
                                onClick={() => handleAchievementClick(achievement)}
                            />
                        ))}
                    </AchievementGrid>
                </Card>

                {/* Leaderboard */}
                <Card variant="glass" className="p-6 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-secondary" />
                            Classifica
                        </h3>
                        <Badge variant="outline">Questa Settimana</Badge>
                    </div>
                    <div className="space-y-3">
                        {leaderboard.map((user, index) => (
                            <div
                                key={user.rank}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-[1.02]",
                                    user.rank <= 3
                                        ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
                                        : "bg-muted/30 hover:bg-muted/50",
                                    `animate-fade-in stagger-${index + 1}`
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-muted-foreground w-8">
                                        {user.rank <= 3 ? ['🥇', '🥈', '🥉'][user.rank - 1] : `#${user.rank}`}
                                    </span>
                                    <Avatar className="h-8 w-8 border-2 border-background">
                                        <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                                            {user.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold">{user.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary">{user.points.toLocaleString()}</span>
                                    {user.trend === 'up' && (
                                        <TrendingUp className="h-4 w-4 text-secondary animate-bounce-soft" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Gamification;

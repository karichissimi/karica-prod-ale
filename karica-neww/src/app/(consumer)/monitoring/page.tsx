"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Zap, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AnimatedLogo from '@/components/AnimatedLogo';

const Monitoring = () => {
    const devices = [
        { id: 1, name: 'Frigorifero', type: 'fridge', power: 150, status: 'active', consumption: '2.4 kWh' },
        { id: 2, name: 'Lavatrice', type: 'washing_machine', power: 2000, status: 'standby', consumption: '0.5 kWh' },
        { id: 3, name: 'Lavastoviglie', type: 'dishwasher', power: 1800, status: 'active', consumption: '1.8 kWh' },
        { id: 4, name: 'Climatizzatore', type: 'ac', power: 1500, status: 'active', consumption: '3.2 kWh' },
    ];

    const hourlyData = [
        { ora: "00:00", consumo: 1.2 },
        { ora: "03:00", consumo: 0.8 },
        { ora: "06:00", consumo: 2.1 },
        { ora: "09:00", consumo: 3.5 },
        { ora: "12:00", consumo: 4.2 },
        { ora: "15:00", consumo: 3.8 },
        { ora: "18:00", consumo: 5.1 },
        { ora: "21:00", consumo: 4.5 },
        { ora: "24:00", consumo: 2.3 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <AnimatedLogo className="h-12 w-12" />
                    <div>
                        <h2 className="text-3xl font-bold">Monitoraggio Consumi</h2>
                        <p className="text-muted-foreground">Analizza i tuoi dispositivi e consumi energetici</p>
                    </div>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Aggiungi Dispositivo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Consumo Attuale</p>
                            <p className="text-2xl font-bold">3.8 kW</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-secondary/10">
                            <TrendingDown className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">vs Ieri</p>
                            <p className="text-2xl font-bold text-secondary">-12%</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-accent/10">
                            <Zap className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Dispositivi Attivi</p>
                            <p className="text-2xl font-bold">3/4</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6 glass-effect hover-lift">
                <h3 className="text-xl font-semibold mb-4">Grafico Consumo Orario</h3>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="ora"
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            style={{ fontSize: '12px' }}
                            label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="consumo"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            name="Consumo (kW)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">I Tuoi Dispositivi</h3>
                </div>
                <div className="space-y-4">
                    {devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary/10">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">{device.name}</p>
                                    <p className="text-sm text-muted-foreground">{device.power}W</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-semibold">{device.consumption}</p>
                                    <p className="text-sm text-muted-foreground">oggi</p>
                                </div>
                                <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                                    {device.status === 'active' ? 'Attivo' : 'Standby'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Monitoring;

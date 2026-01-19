import { Card } from "@/components/ui/card";
import { CardWithWatermark } from "@/components/ui/card-watermark";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Share2, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AnimatedStat, ScrollReveal } from "@/components/ui/animated-stat";
export const CERDashboard = () => {
  const community = {
    name: 'Comunità Energetica Locale',
    members: 42,
    energyShared: '1,250 kWh',
    savings: '€342',
  };

  const members = [
    { id: 1, name: 'Mario Rossi', contribution: '45 kWh', role: 'Producer' },
    { id: 2, name: 'Laura Bianchi', contribution: '38 kWh', role: 'Producer' },
    { id: 3, name: 'Giuseppe Verdi', contribution: '52 kWh', role: 'Producer' },
    { id: 4, name: 'Anna Russo', contribution: '29 kWh', role: 'Consumer' },
    { id: 5, name: 'Paolo Neri', contribution: '41 kWh', role: 'Producer' },
  ];

  const monthlyEnergyData = [
    { month: "Gen", energia: 820, risparmio: 180 },
    { month: "Feb", energia: 950, risparmio: 210 },
    { month: "Mar", energia: 1100, risparmio: 280 },
    { month: "Apr", energia: 1050, risparmio: 250 },
    { month: "Mag", energia: 1250, risparmio: 342 },
  ];

  const contributorChartData = members.map(m => ({
    name: m.name.split(' ')[0],
    kWh: parseInt(m.contribution),
  }));

  return (
    <div className="space-y-4">
      <ScrollReveal>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Comunità Energetica</h2>
            <p className="text-muted-foreground text-sm">Condividi e risparmia con la tua comunità</p>
          </div>
          <Button variant="outline" size="sm">Invita Membri</Button>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <CardWithWatermark className="p-5 bg-primary" watermarkPosition="bottom-right" watermarkSize="lg" watermarkOpacity={0.08}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1.5 text-primary-foreground">{community.name}</h3>
              <p className="text-primary-foreground/80 mb-3 text-sm">
                Sei parte di una comunità che condivide energia rinnovabile
              </p>
              <div className="flex gap-3">
                <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  <AnimatedStat end={42} /> membri
                </Badge>
                <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  <AnimatedStat end={1250} separator="." suffix=" kWh" /> condivisi
                </Badge>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary-foreground/10">
              <Award className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
        </CardWithWatermark>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ScrollReveal delay={200}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-secondary/10">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tuo Contributo</p>
                <p className="text-xl font-bold"><AnimatedStat end={38} suffix=" kWh" /></p>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10">
                <Share2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Energia Condivisa</p>
                <p className="text-xl font-bold"><AnimatedStat end={1250} separator="." suffix=" kWh" /></p>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={400}>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risparmio Totale</p>
                <p className="text-xl font-bold"><AnimatedStat end={342} prefix="€" /></p>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>

      <ScrollReveal delay={500}>
        <Card className="p-5 glass-effect hover-lift">
          <h3 className="text-base font-semibold mb-3">Andamento Mensile</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyEnergyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="energia" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2.5}
                name="Energia (kWh)"
              />
              <Line 
                type="monotone" 
                dataKey="risparmio" 
                stroke="hsl(var(--secondary))" 
                strokeWidth={2.5}
                name="Risparmio (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={600}>
        <Card className="p-5 glass-effect hover-lift">
          <h3 className="text-base font-semibold mb-3">Top Contributors</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={contributorChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar 
                dataKey="kWh" 
                fill="hsl(var(--primary))"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </ScrollReveal>
    </div>
  );
};

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { parseTimeToSeconds, createEmptyParticipantStats } from '../../utils/helpers';

interface StatsChartsProps {
    currentState: any;
    activeParticipants: string[];
    getParticipantColor: (name: string) => string;
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ currentState, activeParticipants, getParticipantColor }) => {
    // 1. Data for Global Time Distribution Pie Chart
    const totalImproSeconds = currentState.history.reduce((acc: number, e: any) => acc + parseTimeToSeconds(e.improTime), 0);
    const totalDebriefSeconds = currentState.history.reduce((acc: number, e: any) => acc + parseTimeToSeconds(e.debriefTime), 0);
    const totalWarmupSeconds = Math.floor(currentState.warmupHistory.reduce((acc: number, e: any) => acc + (e.durationMs || 0), 0) / 1000);
    const totalPlateauSeconds = Math.floor(currentState.plateauHistory.reduce((acc: number, e: any) => acc + (e.durationMs || 0), 0) / 1000);

    const pieData = [
        { name: 'Impro', value: totalImproSeconds, color: '#61afef' },
        { name: 'Debrief', value: totalDebriefSeconds, color: '#c678dd' },
        { name: 'Chauffe', value: totalWarmupSeconds, color: '#e5c07b' },
        { name: 'Plateau', value: totalPlateauSeconds, color: '#d19a66' },
    ].filter(d => d.value > 0);

    // 2. Data for Participant Duration Bar Chart
    const barData = activeParticipants.map(name => {
        const pStats = currentState.stats.participations[name] || createEmptyParticipantStats();
        return {
            name,
            'Temps Main (min)': Math.round((pStats.totalMain || 0) / 60),
            'Temps Bonus (min)': Math.round((pStats.totalBonus || 0) / 60),
        };
    }).sort((a, b) => (b['Temps Main (min)'] + b['Temps Bonus (min)']) - (a['Temps Main (min)'] + a['Temps Bonus (min)']));

    // 3. Data for Evolution Line Chart
    const dailyTotals: any = {};
    const getDateKey = (ts: number) => new Date(ts).toLocaleDateString('fr-CA');
    
    currentState.warmupHistory.forEach((e: any) => {
        const k = getDateKey(e.timestamp);
        if (!dailyTotals[k]) dailyTotals[k] = { date: k, 'Chauffe (min)': 0, 'Plateau (min)': 0, 'Impro (min)': 0, 'Debrief (min)': 0 };
        dailyTotals[k]['Chauffe (min)'] += (e.durationMs || 0) / 60000;
    });
    currentState.plateauHistory.forEach((e: any) => {
        const k = getDateKey(e.timestamp);
        if (!dailyTotals[k]) dailyTotals[k] = { date: k, 'Chauffe (min)': 0, 'Plateau (min)': 0, 'Impro (min)': 0, 'Debrief (min)': 0 };
        dailyTotals[k]['Plateau (min)'] += (e.durationMs || 0) / 60000;
    });
    currentState.history.forEach((e: any) => {
        const k = getDateKey(e.timestamp);
        if (!dailyTotals[k]) dailyTotals[k] = { date: k, 'Chauffe (min)': 0, 'Plateau (min)': 0, 'Impro (min)': 0, 'Debrief (min)': 0 };
        dailyTotals[k]['Impro (min)'] += parseTimeToSeconds(e.improTime) / 60;
        dailyTotals[k]['Debrief (min)'] += parseTimeToSeconds(e.debriefTime) / 60;
    });

    const lineData = Object.values(dailyTotals)
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .map((d: any) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
            'Chauffe (min)': Math.round(d['Chauffe (min)']),
            'Plateau (min)': Math.round(d['Plateau (min)']),
            'Impro (min)': Math.round(d['Impro (min)']),
            'Debrief (min)': Math.round(d['Debrief (min)']),
        }));

    const formatTooltipValue = (value: number) => {
        if (value < 60) return `${value}s`;
        const m = Math.floor(value / 60);
        const s = value % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
            
            {/* Pie Chart: Global Time Distribution */}
            <div style={{ backgroundColor: 'var(--input-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>Répartition du Temps Global</h4>
                {pieData.length > 0 ? (
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatTooltipValue(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px 0' }}>Aucune donnée disponible</div>
                )}
            </div>

            {/* Bar Chart: Participant Durations */}
            <div style={{ backgroundColor: 'var(--input-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>Temps de jeu par participant (Minutes)</h4>
                {barData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={barData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="var(--text-color)" angle={-45} textAnchor="end" interval={0} />
                                <YAxis stroke="var(--text-color)" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--border-color)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Temps Main (min)" stackId="a" fill="var(--main-selected)" />
                                <Bar dataKey="Temps Bonus (min)" stackId="a" fill="var(--bonus-selected)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px 0' }}>Aucune donnée disponible</div>
                )}
            </div>

            {/* Line Chart: Evolution over time */}
            <div style={{ backgroundColor: 'var(--input-bg)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '15px' }}>Évolution des temps par session (Minutes)</h4>
                {lineData.length > 0 ? (
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <LineChart
                                data={lineData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="var(--text-color)" />
                                <YAxis stroke="var(--text-color)" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--border-color)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="Impro (min)" stroke="#61afef" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Debrief (min)" stroke="#c678dd" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Chauffe (min)" stroke="#e5c07b" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Plateau (min)" stroke="#d19a66" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px 0' }}>Aucune donnée disponible</div>
                )}
            </div>

        </div>
    );
};

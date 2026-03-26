import { Component } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
    stats = [
        {
            title: 'Total Freelancers',
            value: '1,250',
            change: 12.09,
            positive: true,
            icon: 'users'
        },
        {
            title: 'Projets Actifs',
            value: '345',
            change: 8.5,
            positive: true,
            icon: 'briefcase'
        },
        {
            title: 'Revenu Total',
            value: '98,500 TND',
            change: 13.12,
            positive: true,
            icon: 'revenue'
        },
        {
            title: 'En Attente',
            value: '45',
            change: 10.11,
            positive: false,
            icon: 'pending'
        }
    ];

    chartMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    projectData = [120, 180, 250, 200, 310, 280, 350, 300, 260, 340, 290, 320];
    freelancerData = [80, 100, 150, 130, 200, 170, 220, 190, 160, 210, 180, 200];

    statusData = [
        { label: 'En cours', percentage: 35, count: 14, color: '#22D3EE' },
        { label: 'Terminé', percentage: 25, count: 10, color: '#34D399' },
        { label: 'En attente', percentage: 20, count: 8, color: '#FBBF24' },
        { label: 'Annulé', percentage: 12, count: 5, color: '#F87171' },
        { label: 'En révision', percentage: 8, count: 3, color: '#A78BFA' }
    ];

    recentProjects = [
        { no: 1, project: 'Refonte Site E-commerce', client: 'Société ABC', freelancer: 'Ahmed Ben Ali', date: '15/03/2026', status: 'En cours', amount: '3,500 TND' },
        { no: 2, project: 'App Mobile Livraison', client: 'FastDelivery TN', freelancer: 'Sarra Bouaziz', date: '12/03/2026', status: 'Terminé', amount: '8,200 TND' },
        { no: 3, project: 'Logo & Branding', client: 'StartUp Plus', freelancer: 'Mohamed Trabelsi', date: '10/03/2026', status: 'En attente', amount: '1,200 TND' },
        { no: 4, project: 'Dashboard Analytics', client: 'DataViz Corp', freelancer: 'Ines Gharbi', date: '08/03/2026', status: 'En cours', amount: '5,000 TND' },
        { no: 5, project: 'API Integration', client: 'TechSolutions', freelancer: 'Youssef Meddeb', date: '05/03/2026', status: 'Annulé', amount: '2,800 TND' },
    ];

    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            'En cours': 'status-active',
            'Terminé': 'status-done',
            'En attente': 'status-pending',
            'Annulé': 'status-cancelled',
            'En révision': 'status-review'
        };
        return map[status] || '';
    }

    getChartPath(data: number[]): string {
        const maxVal = 400;
        const width = 700;
        const height = 250;
        const stepX = width / (data.length - 1);

        return data.map((val, i) => {
            const x = i * stepX;
            const y = height - (val / maxVal) * height;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    }

    getChartAreaPath(data: number[]): string {
        const path = this.getChartPath(data);
        const width = 700;
        const height = 250;
        return `${path} L ${width} ${height} L 0 ${height} Z`;
    }

    getDoughnutSegments(): { offset: number; dashArray: string; color: string }[] {
        const total = this.statusData.reduce((acc, d) => acc + d.percentage, 0);
        let cumulative = 0;
        const circumference = 2 * Math.PI * 70;

        return this.statusData.map(d => {
            const segmentLength = (d.percentage / total) * circumference;
            const gap = 4;
            const offset = (cumulative / total) * circumference;
            cumulative += d.percentage;
            return {
                offset: -offset + circumference / 4,
                dashArray: `${segmentLength - gap} ${circumference - segmentLength + gap}`,
                color: d.color
            };
        });
    }
}

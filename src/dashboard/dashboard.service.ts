import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(request: GetDashboardDto) {
    const { startDate, endDate } = request;

    // Ajuste de horários para cobrir o dia inteiro
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const whereDate: Prisma.OrderWhereInput = {
      createdAt: { gte: start, lte: end },
    };

    // Definição do que é considerado "Venda" vs "Orçamento"
    const salesStatus = [
      OrderStatus.CONFIRMED,
      OrderStatus.DONE,
      OrderStatus.SHIPMENT,
    ];

    const [salesData, quotesData, salesForChart, recentOrders] =
      await Promise.all([
        // 1. KPI Vendas & Pedidos (Agrupados)
        // Pega tanto a SOMA (Valor) quanto a CONTAGEM (Qtd Pedidos) para status de venda
        this.prisma.order.aggregate({
          _sum: { finalTotal: true },
          _count: { id: true },
          where: { ...whereDate, status: { in: salesStatus } },
        }),

        // 2. KPI Orçamentos
        // Foca na quantidade de orçamentos (DRAFT)
        this.prisma.order.aggregate({
          _count: { id: true },
          _sum: { finalTotal: true }, // Trazendo valor caso queira mostrar no futuro
          where: { ...whereDate, status: OrderStatus.DRAFT },
        }),

        // 3. Dados para o Gráfico (Apenas vendas concretizadas)
        this.prisma.order.findMany({
          where: { ...whereDate, status: { in: salesStatus } },
          select: { createdAt: true, finalTotal: true },
          orderBy: { createdAt: 'asc' },
        }),

        // 4. Pedidos Recentes
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: { ...whereDate }, // Opcional: filtrar recentes dentro do período ou geral? (aqui está geral do período)
          include: {
            client: { select: { name: true } },
          },
        }),
      ]);

    const chartData = this.processChartData(salesForChart, start, end);

    return {
      kpi: {
        totalRevenue: Number(salesData._sum.finalTotal || 0), // Total de Vendas (R$)
        totalOrders: salesData._count.id, // Total de Pedidos (Qtd)
        totalQuotes: quotesData._count.id, // Total de Orçamentos (Qtd)
      },
      chart: chartData,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        code: order.code,
        clientName: (order as any).client?.name || 'Consumidor Final',
        total: Number(order.finalTotal),
        status: order.status,
        date: order.createdAt,
      })),
    };
  }

  private processChartData(
    orders: { createdAt: Date; finalTotal: any }[],
    start: Date,
    end: Date,
  ) {
    const grouped = new Map<string, number>();
    const diffDays = differenceInDays(end, start);

    orders.forEach((order) => {
      let key = '';
      const date = new Date(order.createdAt);
      const val = Number(order.finalTotal);

      if (diffDays <= 1) {
        key = format(date, 'HH:00');
      } else if (diffDays <= 60) {
        key = format(date, 'dd/MM');
      } else if (diffDays <= 365) {
        key = format(date, 'MMMM', { locale: ptBR });
        key = key.charAt(0).toUpperCase() + key.slice(1);
      } else {
        key = format(date, 'MMM/yy', { locale: ptBR });
        key = key.charAt(0).toUpperCase() + key.slice(1);
      }

      const currentVal = grouped.get(key) || 0;
      grouped.set(key, currentVal + val);
    });

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }
}

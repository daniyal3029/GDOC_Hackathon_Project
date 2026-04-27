import { Router, Request, Response } from 'express';
import { HealthChecker } from '../monitoring/health/HealthChecker';
import { DailyMetric } from '../models/DailyMetric';

const router = Router();
const healthChecker = new HealthChecker();

/**
 * @route GET /admin/dashboard
 * @desc Simple HTML dashboard for system monitoring
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  const health = await healthChecker.getDetailedHealth();
  const recentHistory = await DailyMetric.find().sort({ date: -1 }).limit(7);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Founder Brain - Admin Dashboard</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f1f5f9; margin: 0; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; }
        .status-healthy { color: #22c55e; }
        .status-unhealthy { color: #ef4444; }
        .status-degraded { color: #f59e0b; }
        h1 { margin-bottom: 30px; font-weight: 300; }
        h2 { margin-top: 0; font-size: 1.2rem; color: #94a3b8; }
        canvas { max-height: 250px; }
        .stat-value { font-size: 2rem; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>Founder Brain Monitoring</h1>
      
      <div class="grid">
        <div class="card">
          <h2>System Health</h2>
          <div class="stat-value status-${health.status}">${health.status.toUpperCase()}</div>
          <div>Uptime: ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m</div>
        </div>
        
        <div class="card">
          <h2>Dependencies</h2>
          <ul>
            ${health.dependencies.map(d => `
              <li><strong>${d.name}:</strong> <span class="status-${d.status}">${d.status}</span> (${d.responseTimeMs}ms)</li>
            `).join('')}
          </ul>
        </div>
        
        <div class="card">
          <h2>API Performance</h2>
          <canvas id="performanceChart"></canvas>
        </div>
      </div>

      <script>
        const ctx = document.getElementById('performanceChart').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(recentHistory.reverse().map(h => h.date.toLocaleDateString()))},
            datasets: [{
              label: 'Daily Requests',
              data: ${JSON.stringify(recentHistory.map(h => h.metrics.totalRequests))},
              borderColor: '#3b82f6',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
          }
        });
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

export default router;

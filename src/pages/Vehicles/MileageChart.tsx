import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import { Radio } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Generate stable mock data using seeded values
const genData = (len: number, base: number, variance: number) =>
  Array.from({ length: len }, (_, i) => Math.floor(base + Math.sin(i * 1.3 + 0.7) * variance + variance * 0.5));

const MileageChart: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('month');

  const chartDataMap: Record<string, { labels: string[]; data: number[] }> = {
    day: {
      labels: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
      data: genData(30, 120, 80),
    },
    week: {
      labels: Array.from({ length: 30 }, (_, i) => `第${i + 1}周`),
      data: genData(30, 800, 300),
    },
    month: {
      labels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
      data: genData(12, 3500, 1200),
    },
    year: {
      labels: Array.from({ length: 3 }, (_, i) => `${2024 + i}年`),
      data: genData(3, 40000, 12000),
    },
  };

  const currentData = chartDataMap[period]!;

  const chartData = {
    labels: currentData.labels,
    datasets: [
      {
        label: `里程报表 (km)`,
        data: currentData.data,
        fill: true,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
        pointRadius: period === 'day' || period === 'week' ? 2 : 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false }, ticks: { maxTicksLimit: period === 'day' ? 10 : period === 'week' ? 10 : undefined } },
    },
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Radio.Group value={period} onChange={e => setPeriod(e.target.value)} size="small">
          <Radio.Button value="day">日</Radio.Button>
          <Radio.Button value="week">周</Radio.Button>
          <Radio.Button value="month">月</Radio.Button>
          <Radio.Button value="year">年</Radio.Button>
        </Radio.Group>
      </div>
      <div style={{ height: 300 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default MileageChart;

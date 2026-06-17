import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table } from 'antd';
import { useParams } from 'react-router-dom';
import { getFenceAlerts, getFaultAlerts, getBatteryAlerts } from '@/api/mock';

const AlertTable: React.FC = () => {
  const { t } = useTranslation();
  const { vin } = useParams<{ vin: string }>();

  const data = useMemo(() => {
    if (!vin) return [];

    const fence = getFenceAlerts()
      .filter((a) => a.vin === vin)
      .map((a) => ({
        key: `fence-${a.id}`,
        type: t('risk.type.fence', '围栏预警'),
        content: a.fence_name,
        time: a.time,
      }));

    const fault = getFaultAlerts()
      .filter((a) => a.vin === vin)
      .map((a) => ({
        key: `fault-${a.id}`,
        type: t('risk.type.fault', '故障预警'),
        content: a.content,
        time: a.time,
      }));

    const battery = getBatteryAlerts()
      .filter((a) => a.vin === vin)
      .map((a) => ({
        key: `battery-${a.id}`,
        type: t('risk.type.battery', '电池预警'),
        content: a.content,
        time: a.time,
      }));

    return [...fence, ...fault, ...battery].sort((a, b) => b.time.localeCompare(a.time));
  }, [vin, t]);

  const columns = [
    { title: t('risk.type', '预警类型'), dataIndex: 'type', key: 'type' },
    { title: t('risk.content', '预警内容'), dataIndex: 'content', key: 'content' },
    { title: t('risk.time', '预警时间'), dataIndex: 'time', key: 'time' },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="key"
      size="small"
      scroll={{ x: 'max-content' }}
      pagination={{
        defaultPageSize: 20,
        pageSizeOptions: ['10', '20', '50', '100'],
        showSizeChanger: true,
      }}
    />
  );
};

export default AlertTable;

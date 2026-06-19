import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Tag, Button, message } from 'antd';
import { useParams } from 'react-router-dom';
import { getRepairItems, completeRepairItem } from '@/api/mock';
import type { RepairItem } from '@/types';

const RepairTable: React.FC = () => {
  const { t } = useTranslation();
  const { vin } = useParams<{ vin: string }>();
  const [repairs, setRepairs] = useState<RepairItem[]>([]);

  const loadData = () => {
    if (vin) {
      setRepairs(getRepairItems().filter((r) => r.vin === vin));
    }
  };

  useEffect(() => {
    loadData();
  }, [vin]);

  const handleComplete = (id: string) => {
    completeRepairItem(id);
    message.success(t('toast.repair_completed', '维修已完成'));
    loadData();
  };

  const columns = [
    {
      title: t('repair.type', '维修类型'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag color={v === '故障类' ? 'orange' : 'purple'}>{v}</Tag>,
    },
    { title: t('repair.description', '维修描述'), dataIndex: 'description', key: 'description' },
    { title: t('repair.start_date', '开始时间'), dataIndex: 'startDate', key: 'startDate' },
    { title: t('repair.end_date', '结束时间'), dataIndex: 'endTime', key: 'endTime', render: (v?: string) => v || '-' },
    { title: t('repair.recorder', '操作人'), dataIndex: 'recorder', key: 'recorder', render: (v?: string) => v || 'Admin' },
    {
      title: t('repair.status', '维修状态'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const color = v === 'completed' ? 'green' : 'blue';
        return <Tag color={color}>{t(`repair.status_${v}`, v)}</Tag>;
      },
    },
    {
      title: t('common.action', '操作'),
      key: 'action',
      render: (_: any, r: RepairItem) =>
        r.status === 'repairing' ? (
          <Button type="link" size="small" onClick={() => handleComplete(r.id)}>
            {t('repair.complete', '完成维修')}
          </Button>
        ) : null,
    },
  ];

  return (
    <Table
      dataSource={repairs}
      columns={columns}
      scroll={{ x: 'max-content' }}
      rowKey="id"
      size="small"
      pagination={{
        defaultPageSize: 20,
        pageSizeOptions: ['10', '20', '50', '100'],
        showSizeChanger: true,
      }}
    />
  );
};

export default RepairTable;

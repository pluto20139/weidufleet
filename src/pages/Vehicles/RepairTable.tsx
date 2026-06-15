import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Tag, Button } from 'antd';
import { getVehicleRepairs } from '@/api/mock';

const RepairTable: React.FC = () => {
  const { t } = useTranslation();
  const rawData = useMemo(() => getVehicleRepairs(), []);
  
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(rawData.map((r, i) => ({
      ...r,
      id: i,
      typeStr: r.type,
      descStr: r.desc,
      statusStr: r.status,
      endTime: r.status === '已完成' ? r.start.replace('09:00', '18:00') : '-',
      recorder: ['Carlos', 'Maria', 'Juan'][i % 3],
    })));
  }, [rawData]);

  const handleComplete = (id: number) => {
    setData(prev => prev.map(r => r.id === id ? { ...r, statusStr: '已完成', endTime: new Date().toISOString().slice(0, 16).replace('T', ' ') } : r));
  };

  const columns = [
    { title: '维修类型', dataIndex: 'typeStr', key: 'typeStr', render: (v: string) => <Tag>{v}</Tag> },
    { title: '维修描述', dataIndex: 'descStr', key: 'descStr' },
    { title: '开始时间', dataIndex: 'start', key: 'start' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '操作人', dataIndex: 'recorder', key: 'recorder' },
    {
      title: '维修状态',
      dataIndex: 'statusStr',
      key: 'statusStr',
      render: (v: string) => {
        const color = v === '已完成' ? 'green' : 'blue';
        return <Tag color={color}>{v}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, r: any) => (
        r.statusStr === '维修中' ? (
          <Button type="link" size="small" onClick={() => handleComplete(r.id)}>完成维修</Button>
        ) : null
      ),
    },
  ];
  return <Table dataSource={data} columns={columns} scroll={{ x: 'max-content' }} rowKey="id" size="small" pagination={{ defaultPageSize: 20, pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true }} />;
};

export default RepairTable;

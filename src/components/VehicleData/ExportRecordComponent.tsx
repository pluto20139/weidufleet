import React from 'react';
import { Table, Tag, Button, Spin } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';

interface ExportRecord {
  id: string;
  filename: string;
  filterSummary: string;
  totalCount: number | null;
  createdAt: string;
  status: 'processing' | 'completed';
}

interface ExportRecordProps {
  data: ExportRecord[];
}

const ExportRecordComponent: React.FC<ExportRecordProps> = ({ data }) => {
  const { t } = useTranslation();

  const columns: ColumnsType<ExportRecord> = [
    {
      title: t('vds.col.filename'),
      dataIndex: 'filename',
      key: 'filename',
      render: (text) => <span>📊 {text}</span>,
    },
    {
      title: t('vds.col.count'),
      dataIndex: 'totalCount',
      key: 'totalCount',
      render: (count) => count !== null ? count.toLocaleString() : '—',
    },
    {
      title: t('vds.col.time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: t('vds.col.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'completed') {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t('vds.status.completed')}
            </Tag>
          );
        }
        return (
          <Tag color="processing" icon={<SyncOutlined spin />}>
            {t('vds.status.processing')}
          </Tag>
        );
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => {
        if (record.status === 'completed') {
          return (
            <Button type="link" icon={<DownloadOutlined />} onClick={() => console.log('Download', record.id)}>
              {t('vds.action.download')}
            </Button>
          );
        }
        return (
          <Button type="link" disabled icon={<Spin size="small" />}>
            {t('vds.status.processing')}
          </Button>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      pagination={false}
    />
  );
};

export default ExportRecordComponent;

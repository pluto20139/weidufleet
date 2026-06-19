import React from 'react';
import { Table, Tag, Button, Spin } from 'antd';
import { DownloadOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { ExportTask } from '@/types';

interface ExportRecordProps {
  data: ExportTask[];
}

const ExportRecordComponent: React.FC<ExportRecordProps> = ({ data }) => {
  const { t } = useTranslation();

  const handleDownload = (record: ExportTask) => {
    if (record.status === 'completed' && record.fileUrl) {
      // Use window.open or anchor download
      const a = document.createElement('a');
      a.href = record.fileUrl;
      a.download = record.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const columns: ColumnsType<ExportTask> = [
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
      render: (status: ExportTask['status']) => {
        switch (status) {
          case 'completed':
            return (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                {t('vds.status.completed')}
              </Tag>
            );
          case 'processing':
            return (
              <Tag color="processing" icon={<SyncOutlined spin />}>
                {t('vds.status.processing')}
              </Tag>
            );
          case 'failed':
            return (
              <Tag color="error" icon={<CloseCircleOutlined />}>
                {t('vds.status.failed', '已失败')}
              </Tag>
            );
          case 'expired':
            return (
              <Tag color="default" icon={<ClockCircleOutlined />}>
                {t('vds.status.expired', '已过期')}
              </Tag>
            );
          default:
            return <Tag>{status}</Tag>;
        }
      },
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_, record) => {
        if (record.status === 'completed') {
          return (
            <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
              {t('vds.action.download')}
            </Button>
          );
        }
        if (record.status === 'processing') {
          return (
            <Button type="link" disabled icon={<Spin size="small" />}>
              {t('vds.status.processing')}
            </Button>
          );
        }
        if (record.status === 'expired') {
          return (
            <Button type="link" disabled>
              {t('vds.status.expired', '已过期')}
            </Button>
          );
        }
        // failed
        return (
          <Button type="link" disabled>
            {t('vds.status.failed', '已失败')}
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
      pagination={{
        defaultPageSize: 10,
        pageSizeOptions: ['10', '20', '50', '100'],
        showSizeChanger: true,
        showTotal: (total) => `${total} ${t('common.records')}`,
      }}
    />
  );
};

export default ExportRecordComponent;

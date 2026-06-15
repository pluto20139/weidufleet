import React, { useMemo } from 'react';
import { DatePicker, Button, Space, TreeSelect } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

interface FilterBarProps {
  timeRange: [Dayjs, Dayjs] | null;
  onTimeRangeChange: (dates: any) => void;
  selectedSignals: string[];
  onSignalsChange: (values: string[]) => void;
  onSearch: () => void;
  onReset: () => void;
}

const { RangePicker } = DatePicker;

const signalGroups = [
  {
    title: '电池监控',
    value: 'group_battery',
    children: [
      { title: 'SOC值', value: 'soc' },
      { title: '电池健康度', value: 'soh' },
      { title: '电池温度（平均）', value: 'max_temp' },
      { title: '续航里程数', value: 'range' },
      { title: '日均电耗', value: 'daily_consumption' },
      { title: '充电状态', value: 'charge_status' },
    ],
  },
  {
    title: '充电记录',
    value: 'group_charge',
    children: [
      { title: '充电状态', value: 'charge_record_status' },
      { title: '充电电压', value: 'total_voltage' },
      { title: '充电电流', value: 'total_current' },
      { title: '充电功率', value: 'charge_power' },
      { title: '充电前电量', value: 'charge_before' },
      { title: '充电后电量', value: 'charge_after' },
    ],
  },
  {
    title: '行程记录',
    value: 'group_trip',
    children: [
      { title: '平均车速', value: 'avg_speed' },
      { title: '最高车速', value: 'max_speed' },
      { title: '最低车速', value: 'min_speed' },
      { title: '行驶里程', value: 'mileage' },
    ],
  },
  {
    title: '风控预警',
    value: 'group_warning',
    children: [
      { title: '绝缘电阻', value: 'insulation' },
      { title: '温度差异报警', value: 'temp_alert' },
    ],
  },
  {
    title: '驾驶预警',
    value: 'group_driving',
    children: [
      { title: '对车一级预警', value: 'driving_fcw1' },
      { title: '对车二级预警', value: 'driving_fcw2' },
    ],
  },
];

const FilterBarComponent: React.FC<FilterBarProps> = ({
  timeRange,
  onTimeRangeChange,
  selectedSignals,
  onSignalsChange,
  onSearch,
  onReset,
}) => {
  const { t } = useTranslation();

  // All valid leaf signal values
  const allSignalValues = useMemo(
    () => signalGroups.flatMap(g => g.children.map(c => c.value)),
    [],
  );

  const treeData = useMemo(() => {
    return signalGroups.map(group => ({
      title: group.title,
      value: group.value,
      key: group.value,
      children: group.children.map(child => ({
        title: child.title,
        value: child.value,
        key: child.value,
      })),
    }));
  }, []);

  const handleTreeChange = (values: string[]) => {
    // Filter out group keys, only keep leaf values
    const leafValues = values.filter(v => !v.startsWith('group_'));
    onSignalsChange(leafValues);
  };

  const isAllSelected = selectedSignals.length === allSignalValues.length;

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{t('common.time', '选择时间')}:</span>
        <RangePicker
          showTime={{ format: 'HH:mm' }}
          format="YYYY/MM/DD HH:mm"
          value={timeRange}
          onChange={onTimeRangeChange}
          style={{ width: 320 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{t('common.search', '选择信号')}:</span>
        <TreeSelect
          treeData={treeData}
          value={selectedSignals}
          onChange={handleTreeChange}
          multiple
          treeCheckable
          showCheckedStrategy="SHOW_CHILD"
          placeholder={t('vds.selected_signals', { n: 0 })}
          style={{ width: 400 }}
          maxTagCount="responsive"
        />
        <Button
          size="small"
          type="link"
          onClick={() => onSignalsChange(isAllSelected ? [] : allSignalValues)}
        >
          {isAllSelected ? t('common.reset', '取消全选') : '全选'}
        </Button>
        <Space>
          <Button type="primary" icon={<SearchOutlined />} onClick={onSearch}>
            {t('common.search')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            {t('common.reset')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default FilterBarComponent;

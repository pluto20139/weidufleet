import React, { useMemo } from 'react';
import { Tree, Input, message } from 'antd';
import type { TreeDataNode } from 'antd';
import { useTranslation } from 'react-i18next';
import { SearchOutlined } from '@ant-design/icons';
import { maskPlate } from '@/utils/masking';

interface VehicleTreeProps {
  selectedVehicles: string[];
  onChange: (keys: string[]) => void;
}

const plates = ['京A88888', '京A88889', '京A88890', '京A88891', '京A88892', '京A88893', '京A88894', '京A88895', '京A88896', '京A88897'];

const mockTreeData: TreeDataNode[] = [
  {
    title: '智利物流集团',
    key: 'tenant_1',
    selectable: false,
    children: plates.slice(0, 5).map((plate, i) => ({
      title: maskPlate(plate),
      key: `V00${i + 1}`,
      isLeaf: true,
    })),
  },
  {
    title: 'Santiago Transport',
    key: 'tenant_2',
    selectable: false,
    children: plates.slice(5).map((plate, i) => ({
      title: maskPlate(plate),
      key: `V00${i + 6}`,
      isLeaf: true,
    })),
  },
];

const VehicleTreeComponent: React.FC<VehicleTreeProps> = ({ selectedVehicles, onChange }) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = React.useState('');
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>(['tenant_1', 'tenant_2']);
  const [autoExpandParent, setAutoExpandParent] = React.useState(true);

  const onExpand = (newExpandedKeys: React.Key[]) => {
    setExpandedKeys(newExpandedKeys);
    setAutoExpandParent(false);
  };

  const handleCheck = (checkedKeysValue: any, info: any) => {
    const leaves = info.checkedNodes
      .filter((node: any) => node.isLeaf)
      .map((node: any) => node.key);

    if (leaves.length > 10) {
      message.warning(t('vds.warning.max_vehicles'));
      return;
    }

    onChange(leaves);
  };

  const loop = (data: TreeDataNode[]): TreeDataNode[] =>
    data.map((item) => {
      const strTitle = item.title as string;
      const index = strTitle.toLowerCase().indexOf(searchValue.toLowerCase());
      const beforeStr = strTitle.substring(0, index);
      const afterStr = strTitle.slice(index + searchValue.length);
      const title =
        index > -1 ? (
          <span>
            {beforeStr}
            <span style={{ color: '#1677ff' }}>{strTitle.substring(index, index + searchValue.length)}</span>
            {afterStr}
          </span>
        ) : (
          <span>{strTitle}</span>
        );

      if (item.children) {
        return { ...item, title, disableCheckbox: true, children: loop(item.children) };
      }
      return { ...item, title, disableCheckbox: false };
    });

  const filteredTreeData = useMemo(() => loop(mockTreeData), [searchValue]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>
          {t('vds.selected_count', { selectedCount: selectedVehicles.length })}
        </div>
        <Input
          placeholder={t('common.search')}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <Tree
          checkable
          checkStrictly={true}
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          onCheck={handleCheck}
          checkedKeys={{ checked: selectedVehicles, halfChecked: [] }}
          treeData={filteredTreeData}
        />
      </div>
    </div>
  );
};

export default VehicleTreeComponent;

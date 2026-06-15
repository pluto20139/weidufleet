import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { truncateLocation } from '@/utils/masking';

interface LocationPrivacyProps {
  text: string;
}

const LocationPrivacy: React.FC<LocationPrivacyProps> = ({ text }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  // V1.2: auto truncate to street-level precision
  const displayText = truncateLocation(text);

  if (visible) {
    return <span>{displayText}</span>;
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setVisible(true);
      }}
      style={{ color: '#1677ff', cursor: 'pointer' }}
    >
      {t('driving.view_position', '查看位置')}
    </span>
  );
};

export default LocationPrivacy;

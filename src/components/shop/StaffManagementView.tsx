import React from 'react';
import { StaffManagement, StaffManagementProps } from './StaffManagement';

export const StaffManagementView: React.FC<StaffManagementProps> = (props) => {
  return <StaffManagement {...props} />;
};

export type StaffManagementViewProps = StaffManagementProps;
export default StaffManagementView;

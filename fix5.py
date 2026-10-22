import os
import re

def fix(path, new_import):
    with open(path, 'r', encoding='utf8') as f:
        c = f.read()
    c = re.sub(r'import \{.*?getShop.*?\} from \'../../utils/storage\';', new_import, c)
    with open(path, 'w', encoding='utf8') as f:
        f.write(c)

fix('src/components/shop/OwnerDashboard.tsx', "import { getShop, updateShop, getStaffMembers, getJobs, getJobsForUser, getNotifications, getRevenueVisibility, getCalendarMode, isRevenueVisible, setCalendarMode, setRevenueVisibility, updateJobStatus, setJobs, addJob, getStaffPerformanceStats } from '../../utils/storage';")
fix('src/components/shop/StaffDashboard.tsx', "import { getShop, getStaffMembers, getJobsForUser, getCalendarMode, setCalendarMode, getNotifications, subscribeToStateChanges, claimJob, referJob, updateJobStatus } from '../../utils/storage';")
fix('src/components/shop/StaffManagement.tsx', "import { getShop, updateShop, isUsernameAvailable, normalizeUsername, getAllStaffMembers, saveStaffMembers, broadcastStateChange, getStaffMembers, generateNextStaffUsername, subscribeToStateChanges, isStaffUsernameAvailable, addStaffMember, toggleStaffStatus, changeStaffRole, deleteStaffMember, getStaffPerformanceStats } from '../../utils/storage';")

print("Fixed imports")

import os
import re

def walk(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        for name in filenames:
            if name.endswith('.ts') or name.endswith('.tsx'):
                files.append(os.path.join(root, name))
    return files

for f in walk('src'):
    with open(f, 'r', encoding='utf8') as file:
        c = file.read()
    
    orig = c
    c = c.replace('statustotal_prints', 'total_prints')
    c = c.replace('statuspage_count', 'page_count')
    c = c.replace('statuscreated_at', 'created_at')
    c = c.replace('statusassigned_to', 'assigned_to')
    c = c.replace('statuscompleted_by_name', 'completed_by_name')
    c = c.replace('statusassigned_to_name', 'assigned_to_name')
    c = c.replace('currentPc', '""')

    if 'StaffManagement.tsx' in f:
        c = re.sub(r'import \{.*?getShop.*?\} from \'\.\.\/\.\.\/utils\/storage\';',
            "import { getShop, updateShop, isUsernameAvailable, normalizeUsername, getAllStaffMembers, saveStaffMembers, broadcastStateChange, getStaffMembers, generateNextStaffUsername, subscribeToStateChanges, isStaffUsernameAvailable, addStaffMember, toggleStaffStatus, changeStaffRole, deleteStaffMember, getStaffPerformanceStats } from '../../utils/storage';", c)
    
    if orig != c:
        with open(f, 'w', encoding='utf8') as file:
            file.write(c)

print("Done")

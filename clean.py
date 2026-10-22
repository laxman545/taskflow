import os
import re

def clean_file(path):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove object properties completely (keys and values)
    properties_to_remove = [
        'assigned_pc', 'pc_list', 'pc_id', 'from_pc', 'assigned_from_pc',
        'created_from_pc', 'pc_used', 'sent_from_pc', 'last_printed_pc'
    ]
    
    for prop in properties_to_remove:
        # Match property: value, or property={value} or property="value" or property
        # Also handles optional trailing comma
        content = re.sub(rf'\b{prop}\s*[:=]\s*[^,;}}]+[,;]?', '', content)
        content = re.sub(rf'\b{prop}\b\s*[,;]?', '', content)

    # For 'pc', it's tricky because it's a short word. 
    # Match specific pc-related phrases or assignments:
    content = re.sub(r'\bpc\s*[:=]\s*[^,;}}]+[,;]?', '', content)
    
    # Remove specific functions and their imports
    content = re.sub(r'import\s*\{\s*[^}]*?addShopPc[^}]*?\}\s*from\s*[\'"].*?[\'"];', "import { getShop, updateShop, isUsernameAvailable, normalizeUsername, getAllStaffMembers, saveStaffMembers, broadcastStateChange } from '../../utils/storage';", content)
    content = re.sub(r'addShopPc\([^)]*\);?', '', content)
    content = re.sub(r'removeShopPc\([^)]*\);?', '', content)
    content = re.sub(r'getCurrentPc\([^)]*\);?', '', content)
    content = re.sub(r'setCurrentPc\([^)]*\);?', '', content)
    
    # Clean up any leftover empty lines or broken commas
    content = re.sub(r',\s*,', ',', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

files_to_clean = [
    'src/utils/storage.ts',
    'src/components/shop/JobDetailModal.tsx',
    'src/components/shop/NotificationCenter.tsx',
    'src/components/shop/OrderHistoryView.tsx',
    'src/components/shop/OwnerDashboard.tsx',
    'src/components/shop/SendToCustomerModal.tsx',
    'src/components/shop/StaffDashboard.tsx',
    'src/components/shop/StaffManagement.tsx',
    'src/components/shop/ActivityLogView.tsx',
    'src/components/auth/GoogleAuthModal.tsx',
    'src/components/home/Homepage.tsx',
    'src/components/shop/AccountMenu.tsx',
    'src/components/shop/AuthModal.tsx',
    'src/components/shop/FilePreviewModal.tsx',
]

for f in files_to_clean:
    clean_file(f)

print("Done cleaning files.")

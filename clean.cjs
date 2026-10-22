const fs = require('fs');

function cleanFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  
  if (path.includes('storage.ts')) {
    code = code.replace(/setCurrentPc\(.*?\);/g, '');
    code = code.replace(/if \(!localStorage\.getItem\(CURRENT_PC_KEY\)\) \{[\s\S]*?\}/g, '');
    code = code.replace(/assigned_from_pc:.*?,/g, '');
    code = code.replace(/last_printed_pc:.*?,/g, '');
    code = code.replace(/pc:.*?,/g, '');
    code = code.replace(/localStorage\.setItem\(CURRENT_PC_KEY,.*?\);/g, '');
  }

  code = code.replace(/assigned_pc:.*?,/g, '');
  code = code.replace(/pc_used:.*?,/g, '');
  code = code.replace(/pc:.*?,/g, '');
  code = code.replace(/from_pc:.*?,/g, '');
  code = code.replace(/sent_from_pc:.*?,/g, '');

  if (path.includes('StaffManagement.tsx')) {
    code = code.replace(/import \{.*?addShopPc,.*?removeShopPc.*?\} from '\.\.\/\.\.\/utils\/storage';/g, 
        "import { getShop, updateShop, isUsernameAvailable, normalizeUsername, getAllStaffMembers, saveStaffMembers, broadcastStateChange } from '../../utils/storage';");
    code = code.replace(/addShopPc\(/g, '// addShopPc(');
    code = code.replace(/removeShopPc\(/g, '// removeShopPc(');
  }

  fs.writeFileSync(path, code);
}

['src/utils/storage.ts', 
 'src/components/shop/JobDetailModal.tsx',
 'src/components/shop/NotificationCenter.tsx',
 'src/components/shop/OrderHistoryView.tsx',
 'src/components/shop/OwnerDashboard.tsx',
 'src/components/shop/SendToCustomerModal.tsx',
 'src/components/shop/StaffDashboard.tsx',
 'src/components/shop/StaffManagement.tsx',
 'src/components/shop/ActivityLogView.tsx',
 'src/components/auth/GoogleAuthModal.tsx',
 'src/components/home/Homepage.tsx'
].forEach(cleanFile);

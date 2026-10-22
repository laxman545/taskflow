import os
import re

def fix_storage():
    with open('src/utils/storage.ts', 'r', encoding='utf8') as f:
        content = f.read()
    
    # Fix broken function definitions
    content = re.sub(r'if \(matchedStaff\.\)\s*\{[^}]*\}\s*', '', content)
    content = re.sub(r'export function\s*:\s*string\s*\{\s*try\s*\{\s*const\s*raw\s*=\s*localStorage\.getItem\(CURRENT_PC_KEY\);.*?\}\s*', '', content, flags=re.DOTALL)
    content = re.sub(r'\?:\s*string;', '', content)
    content = re.sub(r'const currentPc = \s*\n', '\n', content)
    
    content = re.sub(r'export function claimJob\([^)]*staff:\s*StaffMember,.*?(message\?: string; job\?: Job) \}\s*\{', r'export function claimJob(jobId: string, staff: StaffMember): { success: boolean; message?: string; job?: Job } {', content)
    content = re.sub(r'export function recordPrint\([^)]*staff:\s*StaffMember,.*?(message\?: string) \}\s*\{', r'export function recordPrint(jobId: string, fileId: string, staff: StaffMember): { success: boolean; message?: string } {', content)
    
    # Clear initial jobs since they are broken
    content = re.sub(r'function generateInitialJobs\(\): Job\[\] \{.*?return jobs;\n\}', 'function generateInitialJobs(): Job[] { return []; }', content, flags=re.DOTALL)
    
    with open('src/utils/storage.ts', 'w', encoding='utf8') as f:
        f.write(content)

def fix_staff_management():
    with open('src/components/shop/StaffManagement.tsx', 'r', encoding='utf8') as f:
        content = f.read()
    content = re.sub(r'shop\.\?\.\[0\] \|\| \'PC 1 \(Front Desk\)\'', "''", content)
    content = re.sub(r'<div className="mt-4">.*?<label.*?Assigned PC Station.*?</select>.*?</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<td className="py-3 px-4">.*?<div.*?<Monitor className="w-3\.5 h-3\.5" />.*?</div>.*?</td>', '', content, flags=re.DOTALL)
    content = re.sub(r'<th className="py-3 px-4 font-semibold w-48">Station</th>', '', content)
    content = re.sub(r'shop\.\[0\]', '""', content)
    with open('src/components/shop/StaffManagement.tsx', 'w', encoding='utf8') as f:
        f.write(content)

def fix_components():
    for f_name in os.listdir('src/components/shop'):
        if not f_name.endswith('.tsx'): continue
        path = os.path.join('src/components/shop', f_name)
        with open(path, 'r', encoding='utf8') as f:
            content = f.read()
        
        content = re.sub(r'import\s*\{[^}]*getCurrentPc[^}]*\}\s*from\s*[\'"]../../utils/storage[\'"];', "import { getShop } from '../../utils/storage';", content)
        content = re.sub(r'const\s+currentPc\s*=\s*[^;]+;', '', content)
        
        # Some components still have broken objects like  { ..., pc: } or something.
        content = re.sub(r',\s*pc\s*[,}]', '}', content)
        
        with open(path, 'w', encoding='utf8') as f:
            f.write(content)

fix_storage()
fix_staff_management()
fix_components()

print("Fixes applied.")

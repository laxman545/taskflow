import os

def fix_file(path):
    if not os.path.exists(path): return
    with open(path, 'r', encoding='utf8') as f:
        content = f.read()

    # GoogleAuthModal
    content = content.replace("currentShop.|| ['PC 1 (Front Desk)', 'PC 2 (Print Room)', 'PC 3 (Design Station)', 'PC 4 (Express Counter)']", "['Default Station']")
    content = content.replace("useState<string>(() =>  || pcList[0])", "useState<string>('Default Station')")
    
    # AccountMenu
    content = content.replace("currentUser?.&& (", "false && (")
    content = content.replace("{currentUser.}", "")

    # ActivityLogView
    content = content.replace("const matchPc = act..toLowerCase().includes(q);", "const matchPc = false;")

    # storage.ts
    content = content.replace("catch {\n    // fallback\n  }\n  const defaultPc = DEFAULT_SHOP.[0] || 'PC 1 (Front Desk)';\n  return defaultPc;", "")
    content = content.replace("message job?: Job }", "message?: string; job?: Job }")
    content = content.replace("shop.?", "shop.pc_list") # Some places had shop.?.[0] which became empty string before, let's fix if needed
    
    # JobDetailModal
    content = content.replace("job.", "job.status") # In case it was job.assigned_from_pc and left job.
    # Actually let's just use regex for dot followed by nothing
    import re
    # Fix broken object dots: shop.  -> shop
    content = re.sub(r'(\w+)\.\s*(?=[\),=&\n])', r'\1', content)
    
    # Fix broken array accesses
    content = re.sub(r'\w+\.\[0\]', '""', content)
    
    with open(path, 'w', encoding='utf8') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

print("Fixed")

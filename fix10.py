with open('src/components/shop/StaffDashboard.tsx', 'r', encoding='utf8') as f:
    c = f.read()
c = c.replace('const res = referJob("", ""));', 'const res = referJob("", "");')
with open('src/components/shop/StaffDashboard.tsx', 'w', encoding='utf8') as f:
    f.write(c)
print("Fixed parenthesis")

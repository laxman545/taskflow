import re

with open('src/utils/storage.ts', 'r', encoding='utf8') as f:
    s = f.read()

# 1. Fix getJobByNumber
pattern1 = r'export const getJobByNumber = async \(n: string\) => \{.*?catch \(err\) \{\s*return null;\s*\}\s*\};'
new1 = '''export const getJobByNumber = async (n: string) => {
  try {
    const res = await fetch(`http://localhost:5000/api/jobs/public/${n}`);
    const data = await res.json();
    return data.success ? data.job : null;
  } catch (err) {
    return null;
  }
};'''
s = re.sub(pattern1, new1, s, flags=re.DOTALL)

with open('src/utils/storage.ts', 'w', encoding='utf8') as f:
    f.write(s)
print('Fixed')

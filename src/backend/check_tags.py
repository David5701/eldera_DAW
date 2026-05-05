
import re

with open('../frontend/src/components/QuickCareRecord.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Simple tag counter
opens = len(re.findall(r'<div', content))
closes = len(re.findall(r'</div', content))

print(f"Total Opens: {opens}")
print(f"Total Closes: {closes}")

# Check first return
first_return_match = re.search(r'return \((.*?)\);', content, re.DOTALL)
if first_return_match:
    first_return = first_return_match.group(1)
    d = 0
    for i in range(len(first_return)):
        if first_return[i:i+4] == '<div': d += 1
        if first_return[i:i+5] == '</div': d -= 1
    print(f"First return depth: {d}")

# Check second return
second_return_match = re.findall(r'return \((.*?)\);', content, re.DOTALL)
if len(second_return_match) > 1:
    second_return = second_return_match[1]
    d = 0
    for i in range(len(second_return)):
        if second_return[i:i+4] == '<div': d += 1
        if second_return[i:i+5] == '</div': d -= 1
    print(f"Second return depth: {d}")
else:
    print("Second return not found or regex failed")

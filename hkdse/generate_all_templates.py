#!/usr/bin/env python3
import json
import re
import os

# Load P1 data
with open('hkdse/pages/p1_latex_ocr_results.json') as f:
    data = json.load(f)

print(f'Total P1 questions: {len(data)}')

def auto_generate_template(text):
    if not text:
        return {'template': '', 'variables': []}
    
    template = text
    variables = []
    var_index = 0
    
    numbers = re.findall(r'\b\d+\b', text)
    unique_numbers = list(dict.fromkeys(numbers))
    
    for num in unique_numbers:
        letter = chr(97 + var_index)  # a, b, c...
        template = re.sub(r'\b' + num + r'\b', '{' + letter + '}', template)
        num_val = int(num)
        min_val = max(1, num_val - 5)
        max_val = num_val + 5
        if num_val > 100:
            min_val, max_val = 100, 500
        elif num_val > 50:
            min_val, max_val = 50, 200
        variables.append({'name': letter, 'min': min_val, 'max': max_val})
        var_index += 1
    
    return {'template': template, 'variables': variables}

templates = {}
for qid, q in data.items():
    text = q.get('question', '') or q.get('question_text', '') or ''
    result = auto_generate_template(text)
    templates[qid] = {
        'id': qid,
        'topic': q.get('topic', '未知課題'),
        'originalQuestion': text,
        'generalization': result['template'],
        'variables': result['variables'],
        'displacements': ['original', 'swap-numbers'],
        'savedAt': '2026-04-01T00:00:00+08:00',
        'status': 'auto-generated'
    }

print(f'Generated {len(templates)} templates')

# Save to file
with open('hkdse/mimic-generator/auto_templates_all.json', 'w') as f:
    json.dump(templates, f, ensure_ascii=False, indent=2)

print('Saved!')

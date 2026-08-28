import os
import re

directory = 'd:/HCL_WayPoint/backend'

replacements = [
    (r'^from config import ', r'from core.config import '),
    (r'^import config(\s|$)', r'import core.config as config\1'),
    (r'^from auth import ', r'from core.auth import '),
    (r'^import auth(\s|$)', r'import core.auth as auth\1'),
    (r'^from database import ', r'from db.database import '),
    (r'^import database(\s|$)', r'import db.database as database\1'),
    (r'^from models import ', r'from db.models import '),
    (r'^import models(\s|$)', r'import db.models as models\1'),
]

for root, _, files in os.walk(directory):
    if '.venv' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content, flags=re.MULTILINE)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {filepath}')

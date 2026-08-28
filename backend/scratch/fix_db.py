import sys
import os

# Add backend directory to path so we can import from it
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db.database import SessionLocal
from db.models import Roadmap

def fix_roadmaps():
    db = SessionLocal()
    roadmaps = db.query(Roadmap).all()
    count = 0
    for rm in roadmaps:
        changed = False
        node_map = dict(rm.node_map)
        for key, node in node_map.items():
            if not node.get("resources"):
                title = node.get("title", "this topic")
                node["resources"] = [f"YouTube: {title} Tutorial", "Coursera / Udemy"]
                changed = True
        
        if changed:
            rm.node_map = node_map
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(rm, "node_map")
            count += 1
            
    db.commit()
    db.close()
    print(f"Fixed {count} roadmaps in the database.")

if __name__ == "__main__":
    fix_roadmaps()

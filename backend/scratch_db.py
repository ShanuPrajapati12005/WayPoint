import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///./waypoint.db")
Session = sessionmaker(bind=engine)
session = Session()

result = session.execute("SELECT node_map FROM roadmaps")
for row in result:
    node_map = json.loads(row[0])
    for key, node in node_map.items():
        print(f"Node {key}: title={node.get('title')}, has_modules={'modules' in node}")
        if 'modules' in node:
            print(f"  modules count: {len(node['modules'])}")
            print(f"  modules: {node['modules']}")

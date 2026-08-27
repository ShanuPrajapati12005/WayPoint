import sqlite3
db_path = 'c:/users/rudra/WayPoint/backend/waypoint.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT id FROM roadmaps WHERE role_id='java'")
row = c.fetchone()
if row:
    java_id = row[0]
    c.execute("SELECT node_key, new_status, created_at FROM progress_events WHERE roadmap_id=? ORDER BY created_at", (java_id,))
    events = c.fetchall()
    if not events:
        print('No progress events for Java roadmap.')
    for e in events:
        print(e)
else:
    print('no java roadmap')

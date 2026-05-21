import sqlite3
c = sqlite3.connect('orders.db').cursor()
c.execute("SELECT name, image_path FROM items WHERE name LIKE '%KASOORI%' ORDER BY name")
for name, img in c.fetchall():
    print(f"{name[:90]:<90}  img={img}")

print()
print("--- Sample of ANY items showing size details ---")
c.execute("SELECT name FROM items WHERE name LIKE '%X%' AND (name LIKE '%CTN%' OR name LIKE '%SL%' OR name LIKE '%ML%' OR name LIKE '%KG%') LIMIT 10")
for (name,) in c.fetchall():
    print(f"  {name}")

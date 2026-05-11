import models
import database
db = database.SessionLocal()
try:
    deleted = db.query(models.User).filter(models.User.username == "director1").delete()
    db.commit()
    print(f"Eliminado: {deleted} usuario(s) 'director1'")
finally:
    db.close()

import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path

from fastapi import UploadFile


class StorageService(ABC):
    @abstractmethod
    async def save_file(
        self, file: UploadFile, directory: str, filename: str
    ) -> str:
        """Guarda un archivo y retorna la URL/Ruta relativa"""
        pass

    @abstractmethod
    async def delete_file(self, path: str) -> bool:
        """Deletes a file"""
        pass


class LocalFileStorage(StorageService):
    def __init__(self, base_upload_dir: str = None):
        if base_upload_dir:
            self.base_dir = Path(base_upload_dir)
        else:
            # Resolve project root: src/backend/services/storage.py -> ... -> eldera/
            # This ensures we always use the ROOT uploads folder, regardless of CWD.
            project_root = Path(__file__).resolve().parent.parent.parent.parent
            self.base_dir = project_root / "uploads"

        # Ensure base directory exists
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(
        self, file: UploadFile, directory: str, filename: str
    ) -> str:
        """
        Saves file to local disk: uploads/{directory}/{filename}
        Returns: /static/{directory}/{filename} (URL friendly path)
        """
        # Create target directory: uploads/photos/123/
        target_dir = self.base_dir / directory
        target_dir.mkdir(parents=True, exist_ok=True)

        full_path = target_dir / filename

        # Save file
        try:
            with full_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()

        # Return URL path (assuming /static mount points to uploads folder)
        # Note: We use forward slashes for URLs regardless of OS
        return f"/static/{directory}/{filename}"

    async def delete_file(self, path: str) -> bool:
        # Path comes as /static/photos/123/image.jpg
        # We need to convert it back to file system path
        try:
            # Strip /static/ prefix
            if path.startswith("/static/"):
                relative_path = path[8:]
            else:
                relative_path = path

            full_path = self.base_dir / relative_path

            if full_path.exists():
                os.remove(full_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file {path}: {e}")
            return False


# Lógica de inicialización de la instancia singleton
# En una aplicación real, esto se inyectaría según variables de entorno (S3 vs Local)

def get_storage_service() -> StorageService:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_bucket = os.getenv("SUPABASE_BUCKET", "residents")

    if supabase_url and supabase_key:
        print(f"DEBUG: Usando Almacenamiento Supabase en {supabase_url}")
        from .storage_supabase import SupabaseStorageService
        return SupabaseStorageService(supabase_url, supabase_key, supabase_bucket)
    
    print("DEBUG: Usando Almacenamiento de Archivos Local")
    return LocalFileStorage()

storage_service = get_storage_service()

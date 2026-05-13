from fastapi import UploadFile
from supabase import Client, create_client

from .storage import StorageService


class SupabaseStorageService(StorageService):
    def __init__(self, url: str, key: str, bucket_name: str = "residents"):
        self.supabase: Client = create_client(url, key)
        self.bucket_name = bucket_name
        self.url = url

    async def save_file(self, file: UploadFile, directory: str, filename: str) -> str:
        """
        Guarda un archivo en el almacenamiento de Supabase: {directory}/{filename}
        Retorna: URL pública del archivo subido
        """
        # Ruta dentro del bucket: photos/123/image.jpg
        file_path = f"{directory}/{filename}"

        # Leer el contenido del archivo
        content = await file.read()

        try:
            # Subir a Supabase
            # Usamos upsert=True para sobrescribir si ya existe
            self.supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=content,
                file_options={
                    "content-type": file.content_type,
                    "upsert": "true",
                },
            )

            # Obtener URL Pública
            # Nota: El bucket debe ser público para que esto funcione sin tokens
            res = self.supabase.storage.from_(self.bucket_name).get_public_url(file_path)
            return res

        except Exception as e:
            print(f"Error subiendo a Supabase: {e}")
            raise e
        finally:
            await file.seek(0)  # Resetear puntero del archivo por si acaso

    async def delete_file(self, path: str) -> bool:
        """
        Elimina un archivo del almacenamiento de Supabase.
        'path' puede ser la URL pública completa o solo la ruta interna.
        """
        try:
            # Si path es una URL completa, extraemos la ruta relativa
            # Ejemplo: https://xxx.supabase.co/storage/v1/object/public/residents/photos/1/img.jpg
            # Ruta relativa necesaria: photos/1/img.jpg

            internal_path = path
            search_str = f"/storage/v1/object/public/{self.bucket_name}/"

            if search_str in path:
                internal_path = path.split(search_str)[-1]

            self.supabase.storage.from_(self.bucket_name).remove([internal_path])
            return True
        except Exception as e:
            print(f"Error eliminando de Supabase: {e}")
            return False

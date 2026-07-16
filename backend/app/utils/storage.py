import os
import logging
from supabase import create_client, Client

logger = logging.getLogger(__name__)

BUCKET_NAME = "chat-attachments"

# --- INITIALIZE SUPABASE CLIENT ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
else:
    logger.warning("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in environment. Storage uploads will fail.")

def upload_file(file, storage_path: str) -> str:
    """
    Uploads a file to Supabase storage.
    Raises an exception if the upload fails to trigger transaction rollback.
    """
    if not supabase:
        raise Exception("Supabase client is not configured on the server.")

    try:
        # Read file bytes and reset pointer
        file_bytes = file.read()
        file.seek(0)
        
        response = supabase.storage.from_(BUCKET_NAME).upload(
            file=file_bytes,
            path=storage_path,
            file_options={"content-type": file.content_type}
        )
        
        # Check for errors in the Supabase response
        if hasattr(response, 'error') and response.error:
            raise Exception(response.error)
            
        return storage_path
        
    except Exception as e:
        logger.error(f"Storage upload failed for {storage_path}: {str(e)}")
        raise Exception(f"Failed to upload file to storage: {str(e)}")

def delete_file(storage_key: str):
    """Deletes a file from Supabase storage."""
    if not supabase:
        return
        
    try:
        supabase.storage.from_(BUCKET_NAME).remove([storage_key])
    except Exception as e:
        logger.error(f"Storage deletion failed for {storage_key}: {str(e)}")
        raise Exception(f"Failed to delete file: {str(e)}")

def get_public_url(storage_key: str) -> str:
    """Generates a public URL for a given storage key."""
    if not storage_key or not supabase:
        return None
        
    try:
        return supabase.storage.from_(BUCKET_NAME).get_public_url(storage_key)
    except Exception as e:
        logger.error(f"Failed to generate public URL for {storage_key}: {str(e)}")
        return None
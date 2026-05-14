from fastapi.testclient import TestClient

from src.backend.main import app

client = TestClient(app)


def test_read_root():
    """Verifica que la API está operativa y responde en el root."""
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "online"


def test_health_check():
    """Verifica el endpoint de salud del sistema."""
    response = client.get("/")
    assert response.status_code == 200
    assert "version" in response.json()

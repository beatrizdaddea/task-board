from django.conf import settings
from django.test import override_settings


def test_project_uses_postgresql() -> None:
    assert settings.DATABASES["default"]["ENGINE"] == "django.db.backends.postgresql"


@override_settings(CORS_ALLOWED_ORIGINS=["http://localhost:5173"])
def test_cors_preflight_allows_configured_frontend_origin(client) -> None:
    response = client.options(
        "/api/v1/auth/login/",
        headers={
            "origin": "http://localhost:5173",
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert response["Access-Control-Allow-Credentials"] == "true"
    assert "POST" in response["Access-Control-Allow-Methods"]
    assert "content-type" in response["Access-Control-Allow-Headers"]


@override_settings(CORS_ALLOWED_ORIGINS=["http://localhost:5173"])
def test_cors_preflight_rejects_unconfigured_origin(client) -> None:
    response = client.options(
        "/api/v1/auth/login/",
        headers={
            "origin": "https://malicious.example",
            "access-control-request-method": "POST",
        },
    )

    assert response.status_code == 200
    assert "Access-Control-Allow-Origin" not in response

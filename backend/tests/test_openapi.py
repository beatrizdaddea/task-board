import pytest
from django.urls import reverse
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    ("route_name", "expected_content"),
    [
        ("schema", b"openapi: 3.0.3"),
        ("swagger-ui", b"SwaggerUIBundle"),
        ("redoc", b"<redoc"),
    ],
)
def test_api_documentation_routes_are_public(
    route_name: str, expected_content: bytes
) -> None:
    response = APIClient().get(reverse(route_name))

    assert response.status_code == 200
    assert expected_content in response.content


def test_openapi_schema_documents_versioned_api_and_jwt_security() -> None:
    response = APIClient().get(reverse("schema"), HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "TaskBoard API"
    assert schema["info"]["version"] == "1.0.0"
    assert "/api/v1/tasks/" in schema["paths"]
    assert "/api/v1/categories/" in schema["paths"]
    assert "/api/v1/notifications/" in schema["paths"]
    assert "/api/v1/notifications/{id}/read/" in schema["paths"]
    assert "/api/v1/notifications/read-all/" in schema["paths"]
    assert "/api/v1/auth/login/" in schema["paths"]
    assert "jwtAuth" in schema["components"]["securitySchemes"]

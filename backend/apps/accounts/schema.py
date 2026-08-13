from django.conf import settings
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.plumbing import build_bearer_security_scheme_object


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "apps.accounts.authentication.CookieJWTAuthentication"
    name = ["jwtAuth", "cookieAuth"]

    def get_security_requirement(self, auto_schema):
        return [{"jwtAuth": []}, {"cookieAuth": []}]

    def get_security_definition(self, auto_schema):
        return [
            build_bearer_security_scheme_object(
                header_name="Authorization",
                token_prefix="Bearer",
                bearer_format="JWT",
            ),
            {
                "type": "apiKey",
                "in": "cookie",
                "name": settings.JWT_ACCESS_COOKIE_NAME,
                "description": (
                    "JWT access cookie. Unsafe requests also require the "
                    "X-CSRFToken header."
                ),
            },
        ]

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.serializers import (
    AuthenticatedUserSerializer,
    DetailSerializer,
    UserRegistrationSerializer,
)


class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = (AllowAny,)


class AuthenticatedUserView(generics.RetrieveAPIView):
    serializer_class = AuthenticatedUserSerializer

    def get_object(self):
        return self.request.user


def set_token_cookie(
    response: Response, name: str, token: str, *, max_age: int, path: str
) -> None:
    response.set_cookie(
        name,
        token,
        max_age=max_age,
        path=path,
        secure=settings.JWT_COOKIE_SECURE,
        httponly=True,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    set_token_cookie(
        response,
        settings.JWT_ACCESS_COOKIE_NAME,
        access_token,
        max_age=int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
        path=settings.JWT_ACCESS_COOKIE_PATH,
    )
    set_token_cookie(
        response,
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh_token,
        max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
        path=settings.JWT_REFRESH_COOKIE_PATH,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        path=settings.JWT_ACCESS_COOKIE_PATH,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        path=settings.JWT_REFRESH_COOKIE_PATH,
        samesite=settings.JWT_COOKIE_SAMESITE,
    )


def blacklist_refresh_token(raw_token: str | None) -> None:
    if not raw_token or not hasattr(RefreshToken, "blacklist"):
        return

    try:
        RefreshToken(raw_token).blacklist()
    except TokenError:
        pass


@method_decorator(csrf_protect, name="dispatch")
class CookieTokenObtainPairView(TokenObtainPairView):
    @extend_schema(responses=DetailSerializer)
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        access_token = response.data["access"]
        refresh_token = response.data["refresh"]
        set_auth_cookies(response, access_token, refresh_token)
        response.data = {"detail": "Login successful."}
        return response


@method_decorator(csrf_protect, name="dispatch")
class CookieTokenRefreshView(TokenRefreshView):
    @extend_schema(request=None, responses=DetailSerializer)
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data={"refresh": request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)}
        )

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as error:
            raise InvalidToken(error.args[0]) from error

        access_token = serializer.validated_data["access"]
        response = Response({"detail": "Token refreshed."}, status=status.HTTP_200_OK)
        set_token_cookie(
            response,
            settings.JWT_ACCESS_COOKIE_NAME,
            access_token,
            max_age=int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds()),
            path=settings.JWT_ACCESS_COOKIE_PATH,
        )

        refresh_token = serializer.validated_data.get("refresh")
        if refresh_token:
            set_token_cookie(
                response,
                settings.JWT_REFRESH_COOKIE_NAME,
                refresh_token,
                max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
                path=settings.JWT_REFRESH_COOKIE_PATH,
            )

        return response


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfCookieView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    @extend_schema(responses=DetailSerializer)
    def get(self, request):
        return Response({"detail": "CSRF cookie set."})


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    @extend_schema(request=None, responses={status.HTTP_204_NO_CONTENT: None})
    def post(self, request):
        blacklist_refresh_token(request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME))
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response

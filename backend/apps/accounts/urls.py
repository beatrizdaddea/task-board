from django.urls import path

from apps.accounts.views import (
    AuthenticatedUserView,
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CsrfCookieView,
    LogoutView,
    UserRegistrationView,
)

app_name = "accounts"

urlpatterns = [
    path("csrf/", CsrfCookieView.as_view(), name="csrf"),
    path("me/", AuthenticatedUserView.as_view(), name="me"),
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("refresh/", CookieTokenRefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
]

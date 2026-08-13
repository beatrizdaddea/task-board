from rest_framework import serializers

from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "type",
            "task",
            "message",
            "created_at",
            "read_at",
        )
        read_only_fields = fields


class ReadAllNotificationsResponseSerializer(serializers.Serializer):
    updated = serializers.IntegerField(min_value=0)

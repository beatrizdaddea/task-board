from rest_framework import serializers

from apps.categories.models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value):
        owner = self.context["request"].user
        categories = Category.objects.filter(owner=owner, name__iexact=value)

        if self.instance is not None:
            categories = categories.exclude(pk=self.instance.pk)

        if categories.exists():
            raise serializers.ValidationError(
                "Você já possui uma categoria com este nome."
            )

        return value

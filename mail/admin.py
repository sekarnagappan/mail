from django.contrib import admin
from .models import User, Email
# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "first_name", "last_name", "email",
                    "is_active", "is_staff", "is_superuser",
                    "last_login", "date_joined"
                    )

class EmailAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "subject","body",
                    "timestamp", "read", "archived")

admin.site.register(User, UserAdmin)
admin.site.register(Email, EmailAdmin)

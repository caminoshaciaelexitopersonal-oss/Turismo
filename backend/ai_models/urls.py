from django.urls import path
from .views import UserLLMConfigView

urlpatterns = [
    path('my-llm/', UserLLMConfigView.as_view(), name='user-llm-config'),
]
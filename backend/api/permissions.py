from rest_framework.permissions import BasePermission
from .models import CustomUser


class IsTurista(BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios con el rol de TURISTA.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == CustomUser.Role.TURISTA
        )


class IsAdminOrFuncionario(BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios con rol de
    ADMINISTRADOR o cualquier tipo de FUNCIONARIO.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                CustomUser.Role.ADMIN,
                CustomUser.Role.FUNCIONARIO_DIRECTIVO,
                CustomUser.Role.FUNCIONARIO_PROFESIONAL,
            ]
        )


class IsAdmin(BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios con el rol de ADMIN.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == CustomUser.Role.ADMIN
        )


class IsAdminOrFuncionarioForUserManagement(BasePermission):
    """
    Permiso personalizado para la gestión de usuarios.
    - ADMIN puede gestionar a todos los usuarios.
    - FUNCIONARIO (ambos tipos) puede gestionar a PRESTADOR, ARTESANO y TURISTA.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False

        allowed_roles = [
            CustomUser.Role.ADMIN,
            CustomUser.Role.FUNCIONARIO_DIRECTIVO,
            CustomUser.Role.FUNCIONARIO_PROFESIONAL,
        ]
        # Admin y Funcionarios pueden acceder a la vista (listar, crear, etc.)
        if user.role in allowed_roles:
            # Restricción especial: Funcionarios no pueden crear Admins ni otros Funcionarios
            if request.method == 'POST':
                role_to_create = request.data.get("role")
                if user.role in [CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
                    if role_to_create not in [CustomUser.Role.PRESTADOR, CustomUser.Role.ARTESANO, CustomUser.Role.TURISTA]:
                        return False
            return True

        return False

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin puede gestionar cualquier usuario
        if user.role == CustomUser.Role.ADMIN:
            return True

        # Funcionarios solo pueden gestionar Prestador, Artesano y Turista
        if user.role in [CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            return obj.role in [CustomUser.Role.PRESTADOR, CustomUser.Role.ARTESANO, CustomUser.Role.TURISTA]

        return False


class IsAdminOrDirectivo(BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios con rol de
    ADMINISTRADOR o FUNCIONARIO_DIRECTIVO.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                CustomUser.Role.ADMIN,
                CustomUser.Role.FUNCIONARIO_DIRECTIVO,
            ]
        )

class CaracterizacionPermission(BasePermission):
    """
    Permisos para el modelo de Caracterización.
    - Admin: Total.
    - Funcionario: Solo lectura.
    - Prestador: Crear/actualizar su propia caracterización.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin tiene control total
        if user.role == CustomUser.Role.ADMIN:
            return True

        # Funcionarios tienen permiso de solo lectura
        if user.role in [CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            return request.method in ['GET', 'HEAD', 'OPTIONS']

        # El prestador dueño del perfil puede ver y actualizar su caracterización
        if hasattr(user, 'perfil_prestador') and obj.prestador == user.perfil_prestador:
            return request.method in ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH']

        return False


class ArtesanoCaracterizacionPermission(BasePermission):
    """
    Permisos para el modelo de Caracterización de Artesanos.
    - Admin: Total.
    - Funcionario: Solo lectura.
    - Artesano: Crear/actualizar su propia caracterización.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role == CustomUser.Role.ADMIN:
            return True

        if user.role in [CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            return request.method in ['GET', 'HEAD', 'OPTIONS']

        if hasattr(user, 'perfil_artesano') and obj.artesano == user.perfil_artesano:
            return request.method in ['GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH']

        return False
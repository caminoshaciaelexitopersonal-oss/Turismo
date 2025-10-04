from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import CustomUser, CategoriaPrestador


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


class IsPrestador(BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios con el rol de PRESTADOR.
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == CustomUser.Role.PRESTADOR
        )


class CanManageAtractivos(BasePermission):
    """
    Permiso para gestionar Atractivos Turísticos.
    - Admins/Funcionarios: Tienen control total.
    - Guías de Turismo: Pueden crear atractivos y solo gestionar los propios.
    - Todos: Pueden ver la lista y los detalles.
    """
    def has_permission(self, request, view):
        user = request.user

        # Permitir siempre métodos seguros (GET, HEAD, OPTIONS)
        if view.action in ['list', 'retrieve']:
            return True

        # Si no es un método seguro, el usuario debe estar autenticado
        if not user or not user.is_authenticated:
            return False

        # El permiso para crear (POST)
        if view.action == 'create':
            if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
                return True
            if user.role == CustomUser.Role.PRESTADOR:
                try:
                    # Usamos el slug que es más confiable que el nombre
                    guia_categoria = CategoriaPrestador.objects.get(slug='guias-de-turismo')
                    return user.perfil_prestador.categoria == guia_categoria
                except (CategoriaPrestador.DoesNotExist, AttributeError):
                    return False
            return False

        # Para otras acciones de escritura (update, partial_update, destroy),
        # el permiso se basa en el objeto, así que devolvemos True aquí
        # y dejamos que has_object_permission haga el trabajo.
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Permitir siempre métodos seguros (GET, HEAD, OPTIONS)
        if request.method in SAFE_METHODS:
            return True

        # Si no es un método seguro, el usuario debe estar autenticado
        if not user or not user.is_authenticated:
            return False

        # Admins y Funcionarios pueden editar/borrar cualquier atractivo.
        if user.role in [CustomUser.Role.ADMIN, CustomUser.Role.FUNCIONARIO_DIRECTIVO, CustomUser.Role.FUNCIONARIO_PROFESIONAL]:
            return True

        # El autor del atractivo puede gestionarlo.
        # Esto cubre al guía que lo creó.
        return obj.autor == user


 # Generated by Django 5.2.6 on 2025-10-01 13:31

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_artesano_descripcion_en_artesano_descripcion_es_and_more"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="formulario",
            name="content_type",
            field=models.ForeignKey(
                blank=True,
                help_text="El tipo de entidad al que se asocia este formulario.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="contenttypes.contenttype",
            ),
        ),
        migrations.AddField(
            model_name="formulario",
            name="object_id",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="El ID de la entidad específica a la que se asocia.",
                null=True,
            ),
        ),
        migrations.AlterUniqueTogether(
            name="formulario",
            unique_together={("nombre", "content_type", "object_id")},
        ),
        migrations.RemoveField(
            model_name="formulario",
            name="categoria",
        ),
    ]
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from api.models import CustomUser, PrestadorServicio, CategoriaPrestador, ContenidoMunicipio
from rest_framework.authtoken.models import Token

class AdminAPITests(APITestCase):
    """
    Pruebas para los endpoints de administración y la lógica de permisos.
    """
    def setUp(self):
        # Crear usuarios con diferentes roles
        self.admin_user = CustomUser.objects.create_superuser(
            username='admin', email='admin@example.com', password='password123'
        )
        self.funcionario_user = CustomUser.objects.create_user(
            username='funcionario', email='funcionario@example.com', password='password123', role=CustomUser.Role.FUNCIONARIO_DIRECTIVO
        )
        self.prestador_user_to_approve = CustomUser.objects.create_user(
            username='prestador_pendiente', email='pendiente@example.com', password='password123', role=CustomUser.Role.PRESTADOR
        )
        self.turista_user = CustomUser.objects.create_user(
            username='turista', email='turista@example.com', password='password123', role=CustomUser.Role.TURISTA
        )

        # Crear perfil para el prestador pendiente
        self.categoria = CategoriaPrestador.objects.create(nombre="Hotel", slug="hoteles")
        self.prestador_profile = PrestadorServicio.objects.create(
            usuario=self.prestador_user_to_approve,
            nombre_negocio="Hotel La Roca",
            categoria=self.categoria,
            aprobado=False # Importante: empieza como no aprobado
        )

        # Crear tokens para autenticación
        self.admin_token = Token.objects.create(user=self.admin_user)
        self.funcionario_token = Token.objects.create(user=self.funcionario_user)
        self.turista_token = Token.objects.create(user=self.turista_user)

    def _get_auth_header(self, token):
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def test_list_prestadores_as_admin(self):
        """Un admin puede listar a los prestadores."""
        url = reverse('admin-prestadores-list')
        response = self.client.get(url, **self._get_auth_header(self.admin_token))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_list_prestadores_as_funcionario(self):
        """Un funcionario puede listar a los prestadores."""
        url = reverse('admin-prestadores-list')
        response = self.client.get(url, **self._get_auth_header(self.funcionario_token))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_prestadores_as_turista_is_forbidden(self):
        """Un turista no puede listar a los prestadores desde el endpoint de admin."""
        url = reverse('admin-prestadores-list')
        response = self.client.get(url, **self._get_auth_header(self.turista_token))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_approve_prestador_as_admin(self):
        """Un admin puede aprobar a un prestador."""
        self.assertFalse(self.prestador_profile.aprobado) # Verificar estado inicial

        url = reverse('admin-prestador-approve', kwargs={'pk': self.prestador_profile.pk})
        response = self.client.patch(url, {}, **self._get_auth_header(self.admin_token))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refrescar el objeto desde la BD y verificar el cambio
        self.prestador_profile.refresh_from_db()
        self.assertTrue(self.prestador_profile.aprobado)

    def test_approve_prestador_as_turista_is_forbidden(self):
        """Un turista no puede aprobar a un prestador."""
        self.assertFalse(self.prestador_profile.aprobado) # Verificar estado inicial

        url = reverse('admin-prestador-approve', kwargs={'pk': self.prestador_profile.pk})
        response = self.client.patch(url, {}, **self._get_auth_header(self.turista_token))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verificar que el estado no cambió
        self.prestador_profile.refresh_from_db()
        self.assertFalse(self.prestador_profile.aprobado)

    def test_filter_prestadores_by_pending(self):
        """El filtro de pendientes funciona correctamente."""
        # Creamos otro prestador que ya está aprobado
        approved_user = CustomUser.objects.create_user(
            username='prestador_aprobado', email='aprobado@example.com', password='password123', role=CustomUser.Role.PRESTADOR
        )
        PrestadorServicio.objects.create(
            usuario=approved_user, nombre_negocio="Restaurante Sol", aprobado=True
        )

        url = reverse('admin-prestadores-list') + '?aprobado=false'
        response = self.client.get(url, **self._get_auth_header(self.admin_token))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['nombre_negocio'], "Hotel La Roca")


class ContenidoMunicipioAPITests(APITestCase):
    """
    Pruebas para el ViewSet de ContenidoMunicipio, verificando permisos mixtos.
    """
    def setUp(self):
        self.admin_user = CustomUser.objects.create_superuser('admin', 'admin@test.com', 'password')
        self.turista_user = CustomUser.objects.create_user(
            'turista', 'turista@test.com', 'password', role=CustomUser.Role.TURISTA
        )

        self.admin_token = Token.objects.create(user=self.admin_user)
        self.turista_token = Token.objects.create(user=self.turista_user)

        self.contenido = ContenidoMunicipio.objects.create(
            seccion=ContenidoMunicipio.Seccion.INTRODUCCION,
            titulo="Bienvenidos a Puerto Gaitán",
            contenido="Un paraíso por descubrir.",
            orden=1
        )
        self.list_url = reverse('contenido-municipio-list')
        self.admin_list_url = reverse('contenido-municipio-list')
        self.admin_detail_url = reverse('contenido-municipio-detail', kwargs={'pk': self.contenido.pk})

    def _get_auth_header(self, token):
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def test_public_can_list_content(self):
        """Cualquier usuario (incluso no autenticado) puede listar el contenido."""
        response = self.client.get(self.list_url)
        expected_count = ContenidoMunicipio.objects.count()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], expected_count)

    def test_admin_can_create_content(self):
        """Un admin puede crear nuevo contenido."""
        initial_count = ContenidoMunicipio.objects.count()
        data = {
            'seccion': ContenidoMunicipio.Seccion.ALOJAMIENTO,
            'titulo': 'Hoteles de Lujo',
            'contenido': 'Descripción de hoteles.',
            'orden': 2
        }
        response = self.client.post(self.admin_list_url, data, **self._get_auth_header(self.admin_token))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContenidoMunicipio.objects.count(), initial_count + 1)

    def test_turista_cannot_create_content(self):
        """Un turista no puede crear contenido."""
        initial_count = ContenidoMunicipio.objects.count()
        data = {'seccion': 'OTRA', 'titulo': 'Intento', 'contenido': '...'}
        response = self.client.post(self.admin_list_url, data, **self._get_auth_header(self.turista_token))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(ContenidoMunicipio.objects.count(), initial_count)

    def test_admin_can_update_content(self):
        """Un admin puede actualizar un bloque de contenido."""
        data = {'titulo': 'Nuevo Título'}
        response = self.client.patch(self.admin_detail_url, data, **self._get_auth_header(self.admin_token))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contenido.refresh_from_db()
        self.assertEqual(self.contenido.titulo, 'Nuevo Título')

    def test_admin_can_delete_content(self):
        """Un admin puede eliminar un bloque de contenido."""
        initial_count = ContenidoMunicipio.objects.count()
        response = self.client.delete(self.admin_detail_url, **self._get_auth_header(self.admin_token))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ContenidoMunicipio.objects.count(), initial_count - 1)
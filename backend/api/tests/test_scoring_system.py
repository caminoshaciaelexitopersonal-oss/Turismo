from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from api.models import (
    CustomUser,
    PrestadorServicio,
    Artesano,
    Publicacion,
    AsistenciaCapacitacion,
    Resena,
    ScoringRule
)

class ScoringSystemTests(TestCase):
    """
    Pruebas para el sistema de puntuación unificado.
    Verifica que las señales y los métodos de recálculo funcionen correctamente.
    """

    def setUp(self):
        # --- Crear usuarios y perfiles ---
        self.prestador_user = CustomUser.objects.create_user(
            'prestador_puntuado', 'prestador_puntuado@example.com', 'password123', role=CustomUser.Role.PRESTADOR
        )
        self.prestador_profile = PrestadorServicio.objects.create(
            usuario=self.prestador_user, nombre_negocio="Hotel Puntuado"
        )

        self.turista_user = CustomUser.objects.create_user(
            'turista_puntuador', 'turista_puntuador@example.com', 'password123', role=CustomUser.Role.TURISTA
        )

        # --- Crear una capacitación ---
        self.capacitacion = Publicacion.objects.create(
            titulo="Capacitación de Prueba de Puntuación",
            slug="capacitacion-de-prueba-puntuacion",
            tipo=Publicacion.Tipo.CAPACITACION,
            puntos_asistencia=15  # Puntos personalizados para esta capacitación
        )

        # --- Cargar las reglas de puntuación ---
        self.scoring_rules = ScoringRule.load()
        self.scoring_rules.puntos_asistencia_capacitacion = 10
        self.scoring_rules.puntos_por_estrella_reseña = 5
        self.scoring_rules.puntos_completar_formulario = 20
        self.scoring_rules.save()


    def test_score_updates_on_capacitacion_asistencia(self):
        """Verifica que los puntos se suman al registrar la asistencia a una capacitación."""
        initial_score = self.prestador_profile.puntuacion_capacitacion

        # Simular asistencia
        AsistenciaCapacitacion.objects.create(
            capacitacion=self.capacitacion,
            usuario=self.prestador_user
        )

        self.prestador_profile.refresh_from_db()

        # La puntuación debe haber aumentado por los puntos definidos en la capacitación
        expected_score = initial_score + self.capacitacion.puntos_asistencia
        self.assertEqual(self.prestador_profile.puntuacion_capacitacion, expected_score)

        # Verificar que el total también se recalculó
        self.assertEqual(self.prestador_profile.puntuacion_total, expected_score)

    def test_score_updates_on_resena_approval(self):
        """Verifica que los puntos se suman cuando una reseña es aprobada."""
        initial_score = self.prestador_profile.puntuacion_reseñas

        # Crear una reseña, pero aún no aprobada
        resena = Resena.objects.create(
            usuario=self.turista_user,
            content_object=self.prestador_profile,
            calificacion=4,
            comentario="Muy buen servicio."
        )

        self.prestador_profile.refresh_from_db()
        self.assertEqual(self.prestador_profile.puntuacion_reseñas, initial_score)

        # Aprobar la reseña (esto debería disparar la señal)
        resena.aprobada = True
        resena.save()

        self.prestador_profile.refresh_from_db()
        expected_score = initial_score + (4 * self.scoring_rules.puntos_por_estrella_reseña)
        self.assertEqual(self.prestador_profile.puntuacion_reseñas, expected_score)
        self.assertEqual(self.prestador_profile.puntuacion_total, expected_score)

    def test_recalcular_puntuacion_total(self):
        """Verifica que el método de recálculo suma correctamente todos los componentes."""
        self.prestador_profile.puntuacion_capacitacion = 10
        self.prestador_profile.puntuacion_reseñas = 20
        self.prestador_profile.puntuacion_verificacion = 30
        self.prestador_profile.puntuacion_formularios = 5
        self.prestador_profile.save()

        self.prestador_profile.recalcular_puntuacion_total()
        self.prestador_profile.refresh_from_db()

        expected_total = 10 + 20 + 30 + 5
        self.assertEqual(self.prestador_profile.puntuacion_total, expected_total)

    def test_scoring_rules_singleton(self):
        """Verifica que el modelo ScoringRule se comporte como un Singleton."""
        rule1 = ScoringRule.load()
        rule2 = ScoringRule.load()
        self.assertEqual(rule1.pk, 1)
        self.assertEqual(rule1.pk, rule2.pk)

        # Verificar que no se pueden crear nuevas instancias
        with self.assertRaises(Exception):
             ScoringRule.objects.create(puntos_asistencia_capacitacion=100)
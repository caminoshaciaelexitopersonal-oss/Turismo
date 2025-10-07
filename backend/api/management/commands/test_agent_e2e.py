import asyncio
from django.core.management.base import BaseCommand
from api.models import CustomUser
from agents.corps.turismo_coronel import get_turismo_coronel_graph

class Command(BaseCommand):
    help = 'Ejecuta una prueba de extremo a extremo del sistema de agentes de IA.'

    def handle(self, *args, **options):
        """Punto de entrada síncrono del comando."""
        try:
            asyncio.run(self._a_handle(*args, **options))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Falló la ejecución asíncrona del comando: {e}"))

    async def _a_handle(self, *args, **options):
        """Lógica asíncrona de la prueba."""
        self.stdout.write(self.style.SUCCESS("--- Iniciando Prueba de Fuego del Sistema de Agentes ---"))

        try:
            # 1. Cargar el Agente Coronel
            agent_graph = get_turismo_coronel_graph()
            self.stdout.write(self.style.SUCCESS("✅ Agente Coronel compilado."))

            # 2. Cargar el contexto del superusuario
            admin_user = await CustomUser.objects.aget(username='admin', is_superuser=True)
            app_context = {
                "user": admin_user,
                "user_id": admin_user.id,
                "username": admin_user.username,
                "role": admin_user.role,
                "is_guest": False,
            }
            self.stdout.write(self.style.SUCCESS(f"✅ Contexto de usuario '{admin_user.username}' cargado."))

            # 3. Definir y enviar la orden de prueba
            test_command = "Coronel, necesito un listado de todos los atractivos turísticos publicados. Quiero ver qué lugares tenemos disponibles."
            self.stdout.write(self.style.WARNING(f"\n[MISIÓN] Enviando orden: \"{test_command}\""))

            initial_state = {
                "general_order": test_command,
                "app_context": app_context,
                "conversation_history": [],
            }

            # 4. Ejecutar el grafo y obtener el resultado
            final_state = await agent_graph.ainvoke(initial_state)

            self.stdout.write(self.style.SUCCESS("\n--- Prueba de Fuego Finalizada ---"))

            # 5. Mostrar el informe final
            if final_state.get("error"):
                self.stdout.write(self.style.ERROR(f"❌ La misión ha fallado."))
                self.stdout.write(self.style.ERROR(f"   Razón: {final_state['error']}"))
            else:
                self.stdout.write(self.style.SUCCESS("✅ La misión se ha completado con éxito."))
                self.stdout.write("\n--- INFORME FINAL DEL CORONEL ---")
                self.stdout.write(final_state.get("final_report", "No se generó un informe final."))
                self.stdout.write("---------------------------------")

        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR("Error Crítico: No se encontró al usuario 'admin'. Asegúrate de haber ejecutado 'setup_test_data'."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ocurrió un error inesperado durante la prueba de extremo a extremo: {e}"))
            import traceback
            traceback.print_exc()
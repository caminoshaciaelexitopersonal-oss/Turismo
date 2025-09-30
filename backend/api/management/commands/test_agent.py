import asyncio
from django.core.management.base import BaseCommand
from agents.corps.turismo_coronel import get_turismo_coronel_graph

class Command(BaseCommand):
    help = 'Ejecuta una prueba de extremo a extremo del sistema de agentes de IA.'

    async def run_test(self):
        """
        Lógica asíncrona de la prueba del agente.
        """
        self.stdout.write(self.style.SUCCESS("--- INICIANDO PRUEBA DEL SISTEMA DE AGENTES ---"))

        orden_de_prueba = "Crear un nuevo perfil de prestador de servicios para el restaurante 'La Brasa Llanera', con email 'brasa@example.com', slug de categoría 'restaurantes' y teléfono '3123456789'."
        self.stdout.write(self.style.HTTP_INFO(f"\n[ORDEN DE PRUEBA]: {orden_de_prueba}\n"))

        coronel_agent = get_turismo_coronel_graph()
        config = {"configurable": {"thread_id": "test-thread-management-command"}}

        try:
            result = await coronel_agent.ainvoke({
                "general_order": orden_de_prueba,
                "app_context": None
            }, config=config)

            final_report = result.get("final_report", "El agente no generó un informe final.")
            self.stdout.write(self.style.SUCCESS("\n--- INFORME FINAL DEL CORONEL ---"))
            self.stdout.write(final_report)
            self.stdout.write(self.style.SUCCESS("---------------------------------\n"))

        except Exception as e:
            self.stderr.write(self.style.ERROR(f"\n--- ❌ ERROR CRÍTICO DURANTE LA PRUEBA DEL AGENTE ---"))
            self.stderr.write(f"Error: {e}")
            self.stderr.write(self.style.ERROR("-----------------------------------------------------\n"))

    def handle(self, *args, **options):
        """
        Punto de entrada para el comando de gestión.
        """
        asyncio.run(self.run_test())
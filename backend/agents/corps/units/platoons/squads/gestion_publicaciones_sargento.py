from .sargento_base_graph import SargentoGraphBuilder
from tools.herramientas_publicaciones import get_publicaciones_soldiers

def get_gestion_publicaciones_sargento_graph():
    """
    Construye y devuelve el agente Sargento de Gestión de Publicaciones compilado.

    Este sargento comanda a la escuadra responsable de todo el ciclo de vida
    del contenido (Noticias, Eventos, Blogs), incluyendo su creación, edición,
    el flujo de aprobación de varios pasos y su publicación final.
    """
    squad = get_publicaciones_soldiers()
    builder = SargentoGraphBuilder(squad, squad_name="Gestión de Publicaciones")
    sargento_agent = builder.build_graph()
    print("✅ Doctrina aplicada: Sargento de Gestión de Publicaciones compilado y listo.")
    return sargento_agent
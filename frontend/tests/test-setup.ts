import { test as base } from '@playwright/test';
import { server } from '../src/mocks/server';

// Iniciar el servidor antes de que comiencen todas las pruebas
base.beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

// Restablecer cualquier manejador que hayamos añadido durante las pruebas
base.afterEach(() => {
  server.resetHandlers();
});

// Detener el servidor una vez que todas las pruebas hayan terminado
base.afterAll(() => {
  server.close();
});

// Exportar el objeto de prueba configurado
export * from '@playwright/test';
export const test = base;
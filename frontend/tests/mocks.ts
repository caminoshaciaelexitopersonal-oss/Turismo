import { test as base } from '@playwright/test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Importa los manejadores que ya hemos definido
import { handlers } from '../src/mocks/handlers';

// Crea el servidor de MSW con los manejadores
const server = setupServer(...handlers);

// Sobrescribe el `test` de Playwright para integrar MSW
export const test = base.extend({
  // Inicia el servidor antes de cada prueba
  async page({ page }, use) {
    // Inicia el servidor de MSW antes de que comiencen las pruebas
    server.listen({ onUnhandledRequest: 'bypass' });

    // Permite que la prueba se ejecute
    await use(page);

    // Detiene el servidor y limpia después de cada prueba
    server.resetHandlers();
    server.close();
  },
});

export { expect } from '@playwright/test';
import { test as base } from '@playwright/test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../src/mocks/handlers';

// Configura el servidor de msw con los manejadores definidos.
const server = setupServer(...handlers);

// Extiende el 'test' base de Playwright.
export const test = base.extend({
  // La siguiente función se ejecutará antes de cada test que use nuestro 'test' extendido.
  auto: [
    async ({}, use) => {
      // Inicia el servidor de mock antes de que comience el test.
      server.listen({ onUnhandledRequest: 'bypass' });
      console.log('MSW server started.');

      // 'use()' es el punto donde el test se ejecuta.
      await use();

      // Limpia los manejadores después de cada test para asegurar un estado limpio.
      server.resetHandlers();
      console.log('MSW handlers reset.');
    },
    { auto: true },
  ],

  // Se asegura de que el servidor se cierre al final de todas las pruebas.
  // Esto se ejecuta una sola vez para todo el worker.
  worker: [
    async ({}, use) => {
      await use();
      server.close();
      console.log('MSW server closed.');
    },
    { scope: 'worker', auto: true },
  ],
});

export { expect } from '@playwright/test';
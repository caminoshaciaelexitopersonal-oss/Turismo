'use client';

import React from 'react';
import { useAgent } from '@/contexts/AgentContext';
import FloatingAgentIcon from './FloatingAgentIcon';
import AgentInterface from './AgentInterface';

/**
 * This component acts as the controller for the agent's UI.
 * It fetches the state from the AgentContext and renders the
 * floating icon and the chat interface accordingly.
 */
export default function AgentController() {
  const { isChatOpen, toggleChat } = useAgent();

  return (
    <>
      <FloatingAgentIcon onClick={toggleChat} />
      <AgentInterface isOpen={isChatOpen} onClose={toggleChat} />
    </>
  );
}
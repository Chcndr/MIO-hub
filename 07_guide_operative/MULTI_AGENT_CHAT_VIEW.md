# Multi-Agent Chat View - Documentazione Componente

**Data:** 28 novembre 2025  
**Commit:** 3f148e2  
**Path:** `/client/src/components/multi-agent/MultiAgentChatView.tsx`

## 📋 Panoramica

`MultiAgentChatView` è un componente React separato che gestisce la visualizzazione delle chat multi-agente nella Dashboard PA.

## 🎯 Funzionalità

### Vista 4 Agenti (mode="multi")
- 4 card read-only in griglia 2x2
- Mostra dialoghi interni da internalTraces
- Filtro automatico per agente

### Vista Singola (mode="single")
- 1 card con input attivo
- Chat diretta con agente selezionato

## 📦 Props

```typescript
interface MultiAgentChatViewProps {
  mode: 'single' | 'multi';
  selectedAgent?: 'mio' | 'manus' | 'abacus' | 'zapier';
  internalTraces: InternalTrace[];
  onSendMessage?: (agent: AgentType, message: string) => void;
}
```

## 🔄 Flusso Dati

User → MIO → internalTraces → MultiAgentChatView → Filtro agente → Card

## 💾 Cronologia localStorage

- `mihub_main_mio_chat`: Chat MIO
- `mihub_internal_traces`: Dialoghi agenti


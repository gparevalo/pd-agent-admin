
modifiquemos los siguientes componentes: 

1. client/src/pages/agents/integrations/CRMIntegrationCard.tsx: necesito que crees los servicios:
    a. /api/channels/status?agentId=${agentId}&type=crm que debe consultar la vista public.v_agent_channels_with_integrations
    b. /api/channels/setup que debe guardar los datos en las tablas public.agent_channels y si hay campos necesarios en public.agent_channel_integrations de lo contrario solo en agent_channels.
    c. habilita un rest para deshabilitar el registro en ambas tablas por el agent_id

2. client/src/pages/agents/integrations/WhatsAppConnector.tsx modifica para que se integre con los rest generados no quites nada de la logica actual solo reemplaza el uso de las tablas directas.

3. client/src/pages/agents/integrations/anterior/N8nCard.tsx modifica  para que se integre con los rest generados no quites nada de la logica actual solo reemplaza el uso de las tablas directas.
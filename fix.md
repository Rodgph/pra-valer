O problema raiz é closure stale — o onMouseUp é registrado no mousedown e carrega um snapshot congelado de openModules e draggingInstanceId. Quando o React re-renderiza durante o arraste, os valores da closure ficam velhos e a lógica de drop falha silenciosamente.
A correção é simples e cirúrgica: usar .getState() direto das stores dentro do onMouseUp, nunca os valores da closure:
tsx// LayoutEngine.tsx — apenas a função handleDragStart corrigida

const handleDragStart = (e: React.MouseEvent) => {
  e.preventDefault();
  if (!instance?.instanceId) return;

  // Captura IDs AGORA (estes não mudam)
  const capturedInstanceId = instance.instanceId;
  const capturedModuleId   = instance.moduleId;
  const capturedSourcePane = node.id;

  setDraggingInstance(capturedInstanceId, capturedSourcePane);

  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "drag-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:99999;cursor:grabbing;background:transparent;";
  document.body.appendChild(overlay);

  // Ghost
  const ghost = document.createElement("div");
  ghost.id = "drag-ghost";
  ghost.style.cssText = `
    position:fixed;pointer-events:none;z-index:100000;
    background:#00FF66;color:#000;font-family:monospace;
    font-size:10px;font-weight:bold;padding:6px 12px;
    transform:translate(-50%,-50%);
    left:${e.clientX}px;top:${e.clientY}px;
  `;
  ghost.innerText = capturedModuleId.toUpperCase();
  document.body.appendChild(ghost);

  const onMouseMove = (ev: MouseEvent) => {
    ghost.style.left = `${ev.clientX}px`;
    ghost.style.top  = `${ev.clientY}px`;
  };

  const onMouseUp = (ev: MouseEvent) => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.getElementById("drag-overlay")?.remove();
    document.getElementById("drag-ghost")?.remove();

    // ✅ ESTADO FRESCO — nunca da closure
    const { openModules, mountModule, setDraggingInstance: clearDrag } =
      useOrchestrator.getState();
    const { setModule: setLayoutModule, splitPane } =
      useLayout.getState();

    // Detecta painel alvo atravessando o overlay
    const target  = document.elementFromPoint(ev.clientX, ev.clientY);
    const paneEl  = target?.closest("[data-pane-id]") as HTMLElement | null;
    const targetPaneId = paneEl?.dataset.paneId;

    if (targetPaneId && targetPaneId !== capturedSourcePane) {
      const rect = paneEl!.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const t = 0.25;

      let zone: "center"|"top"|"bottom"|"left"|"right" = "center";
      if      (y < rect.height * t)       zone = "top";
      else if (y > rect.height * (1 - t)) zone = "bottom";
      else if (x < rect.width  * t)       zone = "left";
      else if (x > rect.width  * (1 - t)) zone = "right";

      if (zone === "center") {
        // SWAP
        const targetModuleId = paneEl!.dataset.moduleId || null;
        setLayoutModule(targetPaneId, capturedModuleId);

        const draggedInst = openModules.find(m => m.instanceId === capturedInstanceId);
        if (draggedInst) mountModule(draggedInst.instanceId, targetPaneId);

        if (targetModuleId) {
          setLayoutModule(capturedSourcePane, targetModuleId);
          const targetInst = openModules.find(
            m => m.moduleId === targetModuleId && m.paneId === targetPaneId
          );
          if (targetInst) mountModule(targetInst.instanceId, capturedSourcePane);
        } else {
          setLayoutModule(capturedSourcePane, null);
        }

      } else {
        // SNAP SPLIT
        const direction: SplitDirection =
          (zone === "top" || zone === "bottom") ? "vertical" : "horizontal";
        const insertAt = (zone === "top" || zone === "left") ? "first" : "second";
        const newPaneId = `pane-${Math.random().toString(36).substr(2, 9)}`;

        setLayoutModule(capturedSourcePane, null);
        splitPane(targetPaneId, direction, newPaneId, capturedModuleId, insertAt);

        const draggedInst = openModules.find(m => m.instanceId === capturedInstanceId);
        if (draggedInst) mountModule(draggedInst.instanceId, newPaneId);
      }

      // Sync cross-window
      setTimeout(() => {
        invoke("emit_global_event", {
          args: {
            event: "sync-layout",
            payload: { action: "full-reset", data: useLayout.getState().root }
          }
        });
      }, 50);
    }

    clearDrag(null);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};
Por que isso resolve:
O Gemini ficou tentando consertar sintoma (condições erradas, IDs errados) sem perceber a causa raiz. O onMouseUp é um closure registrado no mousedown — qualquer valor de hook (openModules, draggingInstanceId) que ele captura fica congelado no momento do clique. Se o React re-renderiza, a store atualiza, mas o closure ainda vê o estado antigo.
useOrchestrator.getState() e useLayout.getState() leem o estado no momento da execução do drop, sempre atual, sem depender de nada que o React possa ter re-renderizado.

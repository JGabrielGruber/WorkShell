export function mountKanban(host: HTMLElement): void {
  host.replaceChildren();
  const board = document.createElement("div");
  board.id = "kanban";
  board.dataset.purpose = "kanban-lanes-container";
  const lanes: Array<{ title: string; count: string; body: string }> = [
    {
      title: "Backlog / Ideias",
      count: "3",
      body: `<article class="kanban-card">
        <div class="kanban-card-meta"><span>Arquitetura</span><span>TASK-112</span></div>
        <h3>Suporte nativo a WebGPU compute shaders</h3>
        <p>Avaliar fallback transparente para sistemas legados sem suporte a float16.</p>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Design System</span><span>TASK-115</span></div>
        <h3>Refino dos tokens de reflexão translúcida</h3>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Pesquisa</span><span>TASK-118</span></div>
        <h3>Benchmark de compositor 180 Hz vs VSync</h3>
      </article>`,
    },
    {
      title: "Em Progresso (Sprint 04)",
      count: "2",
      body: `<article class="kanban-card" data-purpose="active-target-card">
        <div class="kanban-card-meta"><span>Em Foco</span><span>TASK-104</span></div>
        <h3>Integração de Pipelines de Renderização Neural</h3>
        <p>Conexão direta dos buffers de textura com o pipeline ONNX Runtime Web via SIMD.</p>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Frontend</span><span>TASK-082</span></div>
        <h3>Refatoração Auth &amp; Handshake OIDC</h3>
      </article>`,
    },
    {
      title: "Revisão",
      count: "2",
      body: `<article class="kanban-card">
        <div class="kanban-card-meta"><span>DevOps</span><span>TASK-098</span></div>
        <h3>Cluster Kubernetes K3s Edge Autoscaling</h3>
        <p>Testes de carga sob latência de rede simulada com link 4G de alta perda.</p>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Backend</span><span>TASK-101</span></div>
        <h3>Contrato gRPC do inspector TASK-104</h3>
      </article>`,
    },
    {
      title: "Concluído",
      count: "4",
      body: `<article class="kanban-card">
        <div class="kanban-card-meta"><span>Deploy</span><span>TASK-077</span></div>
        <h3>Mecanismo de Cache WASM L2</h3>
        <p>Redução de overhead em 42ms para inicializações a frio.</p>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Shell</span><span>TASK-071</span></div>
        <h3>Shader de vidro para lanes</h3>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Persistência</span><span>TASK-065</span></div>
        <h3>Layout seed no localStorage</h3>
      </article>
      <article class="kanban-card">
        <div class="kanban-card-meta"><span>Chrome</span><span>TASK-058</span></div>
        <h3>Host overlay-dim / overlay-host</h3>
      </article>`,
    },
  ];
  for (const lane of lanes) {
    const section = document.createElement("section");
    section.dataset.purpose = "kanban-lane";
    section.className = "kanban-lane";
    section.innerHTML = `<div class="kanban-lane-head"><h2></h2><span class="kanban-count"></span></div><div class="kanban-lane-body">${lane.body}</div>`;
    section.querySelector("h2")!.textContent = lane.title;
    section.querySelector(".kanban-count")!.textContent = lane.count;
    board.append(section);
  }
  host.append(board);
}

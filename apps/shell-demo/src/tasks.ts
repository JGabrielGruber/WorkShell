export type TaskRecord = {
  id: string;
  lane: string;
  tag: string;
  title: string;
  body?: string;
};

export const TASKS: TaskRecord[] = [
  {
    id: "task-112",
    lane: "Backlog / Ideias",
    tag: "Arquitetura",
    title: "Suporte nativo a WebGPU compute shaders",
    body: "Avaliar fallback transparente para sistemas legados sem suporte a float16.",
  },
  {
    id: "task-115",
    lane: "Backlog / Ideias",
    tag: "Design System",
    title: "Refino dos tokens de reflexão translúcida",
  },
  {
    id: "task-118",
    lane: "Backlog / Ideias",
    tag: "Pesquisa",
    title: "Benchmark de compositor 180 Hz vs VSync",
  },
  {
    id: "task-104",
    lane: "Em Progresso (Sprint 04)",
    tag: "Em Foco",
    title: "Integração de Pipelines de Renderização Neural",
    body: "Conexão direta dos buffers de textura com o pipeline ONNX Runtime Web via SIMD.",
  },
  {
    id: "task-082",
    lane: "Em Progresso (Sprint 04)",
    tag: "Frontend",
    title: "Refatoração Auth & Handshake OIDC",
  },
  {
    id: "task-098",
    lane: "Revisão",
    tag: "DevOps",
    title: "Cluster Kubernetes K3s Edge Autoscaling",
    body: "Testes de carga sob latência de rede simulada com link 4G de alta perda.",
  },
  {
    id: "task-101",
    lane: "Revisão",
    tag: "Backend",
    title: "Contrato gRPC do inspector TASK-104",
  },
  {
    id: "task-077",
    lane: "Concluído",
    tag: "Deploy",
    title: "Mecanismo de Cache WASM L2",
    body: "Redução de overhead em 42ms para inicializações a frio.",
  },
  {
    id: "task-071",
    lane: "Concluído",
    tag: "Shell",
    title: "Shader de vidro para lanes",
  },
  {
    id: "task-065",
    lane: "Concluído",
    tag: "Persistência",
    title: "Layout seed no localStorage",
  },
  {
    id: "task-058",
    lane: "Concluído",
    tag: "Chrome",
    title: "Host overlay-dim / overlay-host",
  },
];

export function taskById(id: string): TaskRecord | undefined {
  return TASKS.find((t) => t.id === id);
}

export function taskTitle(id: string): string {
  return id.replace(/^task-/, "TASK-").toUpperCase();
}

export function fillTask104(host: HTMLElement): void {
  host.innerHTML = `<div class="inspector">
      <aside class="inspector-pane" data-pane="chat">
        <header class="inspector-pane-head">Chat</header>
        <div class="inspector-pane-body">
          <article class="msg">
            <strong>Helena Vaz • Tech Lead</strong>
            <p>Subi a revisão 2 da especificação do engine de inferência neural. Por favor, analisem as flags de shader no markdown ao centro.</p>
          </article>
          <article class="msg">
            <strong>Carlos Mendes • DevOps</strong>
            <p>Validado no cluster de testes. A compilação em WebAssembly gerou 14% menos overhead nos drivers Chromium v122.</p>
          </article>
          <article class="msg">
            <strong>José G. Gruber • Você</strong>
            <p>Perfeito. Estou abrindo o diagrama svg e o markdown de especificações agora para concluir os testes de memória de vídeo.</p>
          </article>
        </div>
      </aside>
      <section class="inspector-pane" data-pane="spec">
        <header class="inspector-pane-head">Spec</header>
        <div class="inspector-pane-body">
          <h2>SPEC_ENGINE_v2.md</h2>
          <p>Arquitetura de Renderização Neural Direta (SIMD / WebGPU)</p>
          <pre><code>export const neuralPipelineConfig = {
  devicePreference: 'high-performance',
  tensorPrecision: 'float16',
  bindingGroupLayout: {
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, storageTexture: { format: 'rgba16float' } }
    ]
  }
};</code></pre>
        </div>
      </section>
      <aside class="inspector-pane" data-pane="attachments">
        <header class="inspector-pane-head">Attachments</header>
        <ul class="file-list">
          <li class="file-row">SPEC_ENGINE_v2.md</li>
          <li class="file-row">Render_Mockup.png</li>
          <li class="file-row">Architecture_Diagram.svg</li>
          <li class="file-row">Benchmark_Results.csv</li>
        </ul>
      </aside>
    </div>`;
}

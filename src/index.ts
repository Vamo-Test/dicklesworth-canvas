// dicklesworth-canvas — Real-time generative art playground using WebGPU.
// Zero-dependency Worker that serves ONE self-contained HTML micro-product. The entire app
// (markup, styles, and logic) is authored by the agent and inlined below as a single document —
// no framework, no build step, no external requests.

const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dicklesworth Canvas</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: var(--background-color);
            color: var(--text-color);
            transition: background-color 0.3s, color 0.3s;
        }
        canvas {
            border: 2px solid var(--border-color);
        }
        :root {
            --background-color: #121212;
            --text-color: #e0e0e0;
            --border-color: #424242;
        }
        @media (prefers-color-scheme: light) {
            :root {
                --background-color: #ffffff;
                --text-color: #000000;
                --border-color: #cccccc;
            }
        }
    </style>
</head>
<body>
    <canvas id="dicklesworthCanvas"></canvas>
    <script>
        const canvas = document.getElementById('dicklesworthCanvas');
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = canvas.getContext('webgpu');

        const format = navigator.gpu.getPreferredCanvasFormat();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        context.configure({
            device: device,
            format: format,
            alphaMode: 'premultiplied'
        });

        const renderPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({
                    code: \`
                        @vertex
                        fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
                            var pos = array<vec2<f32>, 3>(
                                vec2<f32>(0.0, 0.5),
                                vec2<f32>(-0.5, -0.5),
                                vec2<f32>(0.5, -0.5)
                            );
                            return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
                        }
                    \`
                }),
                entryPoint: 'vs_main'
            },
            fragment: {
                module: device.createShaderModule({
                    code: \`
                        @fragment
                        fn fs_main() -> @location(0) vec4<f32> {
                            return vec4<f32>(0.3, 0.2, 0.9, 1.0);
                        }
                    \`
                }),
                entryPoint: 'fs_main',
                targets: [{
                    format: format
                }]
            },
            primitive: {
                topology: 'triangle-list'
            }
        });

        function frame() {
            const commandEncoder = device.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();

            const renderPassDescriptor = {
                colorAttachments: [{
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }]
            };

            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.setPipeline(renderPipeline);
            passEncoder.draw(3, 1, 0, 0);
            passEncoder.end();

            device.queue.submit([commandEncoder.finish()]);
            requestAnimationFrame(frame);
        }

        frame();
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            context.configure({
                device: device,
                format: format,
                alphaMode: 'premultiplied'
            });
        });
    </script>
</body>
</html>`;

export default {
  async fetch(): Promise<Response> {
    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};

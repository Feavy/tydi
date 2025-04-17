import { resolve } from 'path';
import { transform } from 'esbuild';

export default {
    plugins: [
        minifyEs(),
    ],
    build: {
        outDir: `dist/lib`,
        target: "modules",
        minify: "esbuild",
        lib: {
            entry: [
                resolve(__dirname, `src/lib/index.ts`),
            ],
            fileName: "index",
            formats: ["es", "cjs"]
        },
    }
}

function minifyEs() {
    return {
        name: 'minifyEs',
        renderChunk: {
            order: 'post',
            async handler(code, chunk, outputOptions) {
                if (outputOptions.format === 'es') {
                    return await transform(code, { minify: true });
                }
                return code;
            },
        }
    };
}

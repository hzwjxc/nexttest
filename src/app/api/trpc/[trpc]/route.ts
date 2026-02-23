import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { env } from '@/env';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
    return createTRPCContext({
        headers: req.headers,
    });
};

const handler = (req: NextRequest) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext: () => createContext(req),
        onError:
            env.NODE_ENV === 'development'
                ? ({ path, error }) => {
                      console.error(
                          `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
                      );
                  }
                : undefined,
    });

// 配置更大的请求体限制（用于文件上传）
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // 设置请求体大小限制为 10MB
        },
    },
};

export { handler as GET, handler as POST };

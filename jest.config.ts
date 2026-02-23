import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const baseConfig: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}

// next/jest returns an async function — we override after it resolves so our
// settings take precedence over the defaults it generates.
const getJestConfig = async (): Promise<Config> => {
  const nextConfig = await (createJestConfig(baseConfig) as () => Promise<Config>)()
  return {
    ...nextConfig,
    // Explicit alias so jest.mock('@/...') works reliably
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      ...(nextConfig.moduleNameMapper as Record<string, string> | undefined),
    },
    // Transform @mui and @emotion packages (MUI v7 ships ESM; Jest needs CJS)
    transformIgnorePatterns: ['node_modules/(?!(@mui|@emotion)/)'],
  }
}

export default getJestConfig

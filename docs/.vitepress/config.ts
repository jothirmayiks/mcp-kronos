import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MCP Platform',
  description: 'Model Context Protocol as a Service - Connect any company system to AI agents securely and incrementally.',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Architecture', link: '/guide/architecture' },
          { text: 'How It Works', link: '/guide/how-it-works' },
        ]
      },
      {
        text: 'Tenant Onboarding',
        items: [
          { text: 'Onboarding Overview', link: '/guide/onboarding-overview' },
          { text: 'Registering a Company', link: '/guide/onboarding-register' },
          { text: 'Connecting APIs', link: '/guide/onboarding-apis' },
          { text: 'Auth Configuration', link: '/guide/onboarding-auth' },
          { text: 'Activating Tools', link: '/guide/onboarding-tools' },
        ]
      },
      {
        text: 'Authentication and Access',
        items: [
          { text: 'Auth Overview', link: '/guide/auth-overview' },
          { text: 'JWT and SSO Delegation', link: '/guide/auth-jwt' },
          { text: 'Permissions and Roles', link: '/guide/permissions' },
        ]
      },
      {
        text: 'Tools',
        items: [
          { text: 'How Tools Work', link: '/guide/tools-how-it-works' },
          { text: 'Defining Tools for a Tenant', link: '/guide/tools-defining' },
          { text: 'Tool Design Best Practices', link: '/guide/tools-best-practices' },
        ]
      },
      {
        text: 'Reference Client - Kronos',
        items: [
          { text: 'Kronos as Client #1', link: '/guide/kronos-overview' },
          { text: 'Kronos Tool Mapping', link: '/guide/kronos-tools' },
        ]
      },
      {
        text: 'Implementation Timeline',
        items: [
          { text: 'Timeline Overview', link: '/guide/timeline' },
          { text: 'Phase 1 - Core Platform', link: '/guide/phase-1' },
          { text: 'Phase 2 - Kronos Onboarding', link: '/guide/phase-2' },
          { text: 'Phase 3 - Multi-Tenant', link: '/guide/phase-3' },
        ]
      },
    ],
    socialLinks: [],
    footer: {
      message: 'MCP Platform - Internal Engineering Documentation',
    }
  }
})
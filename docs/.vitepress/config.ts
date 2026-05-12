import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MCP Platform',
  description: 'Model Context Protocol as a Service - Connect any company system to AI agents securely and incrementally.',
  head: [
  ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
  ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }],
  ],
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
        text: 'Implementation Journey',
        items: [
          { text: 'Journey Overview', link: '/guide/journey-overview' },
          { text: 'Stage 1 - Kronos MCP Server', link: '/guide/stage-1-kronos-server' },
          { text: 'Stage 2 - Platform Integration & Auth', link: '/guide/stage-2-platform-auth' },
          { text: 'Stage 3 - Login Flow Design', link: '/guide/stage-3-login-flow' },
        ]
      },
      {
        text: 'Planning Phase',
        collapsed: true,
        items: [
          { text: 'Timeline Overview', link: '/guide/timeline' },
          { text: 'Phase 1 - Core Platform', link: '/guide/phase-1' },
          { text: 'Phase 2 - Kronos Onboarding', link: '/guide/phase-2' },
          { text: 'Phase 3 - Multi-Tenant', link: '/guide/phase-3' },
        ]
      },
      {
        text: 'Tenant Onboarding',
        collapsed: true,
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
        collapsed: true,
        items: [
          { text: 'Auth Overview', link: '/guide/auth-overview' },
          { text: 'JWT and SSO Delegation', link: '/guide/auth-jwt' },
          { text: 'Permissions and Roles', link: '/guide/permissions' },
        ]
      },
      {
        text: 'Tools',
        collapsed: true,
        items: [
          { text: 'How Tools Work', link: '/guide/tools-how-it-works' },
          { text: 'Defining Tools for a Tenant', link: '/guide/tools-defining' },
          { text: 'Tool Design Best Practices', link: '/guide/tools-best-practices' },
        ]
      },
      {
        text: 'Reference Client - Kronos',
        collapsed: true,
        items: [
          { text: 'Kronos as Client #1', link: '/guide/kronos-overview' },
          { text: 'Kronos Tool Mapping', link: '/guide/kronos-tools' },
        ]
      },
    ],
    socialLinks: [],
    footer: {
      message: 'MCP Platform - Internal Engineering Documentation',
    }
  }
})
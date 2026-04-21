import { defineConfig } from 'vitepress'

// https://vitepress.vuejs.org/config/app-configs
export default defineConfig({
  title: 'Kronos MCP',
  description: 'Model Context Protocol integration for Kronos — Employee Management Platform',
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
        text: 'Authentication & Access',
        items: [
          { text: 'Auth Overview', link: '/guide/auth-overview' },
          { text: 'Kronos Users (JWT)', link: '/guide/auth-kronos-users' },
          { text: 'External Applications (API Key)', link: '/guide/auth-external-apps' },
          { text: 'External Individual Users (OAuth)', link: '/guide/auth-individual-users' },
          { text: 'Permissions Matrix', link: '/guide/permissions' },
        ]
      },
      {
        text: 'MCP Tools',
        items: [
          { text: 'User Directory', link: '/guide/tools-user-directory' },
          { text: 'Time Report', link: '/guide/tools-time-report' },
          { text: 'Skills', link: '/guide/tools-skills' },
        ]
      },
      {
        text: 'Open Decisions',
        items: [
          { text: 'Potential Clients & Positioning', link: '/guide/open-decisions' },
        ]
      },
      {
        text: 'Implementation Timeline',
        items: [
          { text: 'Timeline Overview', link: '/guide/timeline' },
          { text: 'Phase 1 — User Directory', link: '/guide/phase-1' },
          { text: 'Phase 2 — Time Report', link: '/guide/phase-2' },
          { text: 'Phase 3 — Skills', link: '/guide/phase-3' },
        ]
      },
    ],
    socialLinks: [],
    footer: {
      message: 'Kronos MCP — Internal Engineering Documentation',
    }
  }
})
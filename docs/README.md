# Pickleball Platform

A web-first, PWA-based platform for pickleball game scoring, friends, tournaments, player profiles, ratings, and analytics.

## Product Goal

Build one responsive application that works as:

- Desktop website
- Mobile website
- Installable Android PWA
- Installable iPhone/iPad Home Screen web app
- Optional Android APK later

The project should remain close to ₹0 during development and early usage, while keeping application code and database data portable.

## Core Product Loop

Play → Record Score → Verify Result → Update Match History → Update Statistics/Rating → Compete Again

## Initial Stack

- Frontend: React + TypeScript + Vite
- PWA: Web App Manifest + Service Worker
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- Hosting: Cloudflare Pages
- Source control: GitHub
- Database backups: SQL/PostgreSQL dumps stored outside Supabase

## Principles

1. One codebase for web and mobile.
2. No dependency on an iOS App Store release for the core product.
3. Keep the PostgreSQL data portable.
4. Keep the source code in GitHub.
5. Avoid paid services until usage requires them.
6. Build the scoring and match-history loop before advanced features.

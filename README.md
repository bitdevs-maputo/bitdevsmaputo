# BitDevs Maputo

Simple Jekyll site for community updates, event posts, and blog articles from BitDevs Maputo.

## Development with Ruby and Jekyll

You'll need [Ruby & Jekyll](https://jekyllrb.com/docs/installation/) to run the site locally. Once set up:

- Clone the repository and go into the directory
- Run `bundle install`
- Run `bundle exec jekyll serve`
- Open http://localhost:4000

## Development with Docker

Ensure Docker is running on your machine, then:

- Clone the repository and go into the directory

### With Dockerfile

```bash
docker build -t bitdevsmaputo .
docker run -p 4000:4000 bitdevsmaputo
```

### With Docker Compose

```bash
docker compose build --no-cache
docker compose up
```

Or:

```bash
docker compose up --build -V
```

## Project structure

```text
BitdevsMaputo/
├── _config.yml
├── _data/
│   ├── i18n/
│   │   ├── en.yml
│   │   └── pt.yml
│   └── settings.yml
├── _includes/
│   ├── head.html
│   ├── header.html
│   └── lang-switcher.html
├── _layouts/
│   ├── blog.html
│   ├── default.html
│   └── post.html
├── _posts/
│   ├── blog/
│   │   ├── en/
│   │   │   └── YYYY-MM-DD-title-goes-here.md
│   │   └── pt/
│   │       └── YYYY-MM-DD-title-goes-here.md
│   └── events/
│       ├── en/
│       │   └── YYYY-MM-DD-title-goes-here.md
│       └── pt/
│           └── YYYY-MM-DD-title-goes-here.md
├── assets/
│   ├── css/
│   ├── img/
│   └── js/
├── en/
│   ├── about.md
│   ├── blog.html
│   ├── contacts.md
│   ├── events.html
│   └── index.html
├── pt/
│   ├── about.md
│   ├── blog.html
│   ├── contactos.md
│   ├── events.html
│   └── index.html
├── blog.html
├── events.html
├── Dockerfile
├── docker-compose.yml
├── Gemfile
├── LICENSE
├── README.md
├── robots.txt
├── vercel.json
└── _site/
```

## How posts are organized

The project separates content into two categories:

- `event` posts: meetups, workshops, seminars, and event announcements
- `blog` posts: articles and general content

Each post must include the correct `category` and language.

## Creating a post

### Event example

```md
---
layout: post
published: true
date: 2026-10-17
title: "Socratic Seminar 01"
description: "Description of the event"
image: /assets/img/og-preview.png
lang: "pt"
category: "event"
type: "socratic"
meetup: "https://example.com"
permalink: /pt/events/seminario-socratico-01
---

## Introduction

Text of the event post here.
```

### Blog example

```md
---
layout: post
published: true
date: 2026-10-13
title: "Porque Bitcoin importa"
description: "Uma explicação prática sobre Bitcoin."
image: /assets/img/og-preview.png
lang: "pt"
category: "blog"
permalink: /pt/blog/porque-bitcoin-importa
---

## Introdução

Texto do artigo aqui.
```

## Important notes

- Use `lang: "en"` or `lang: "pt"`
- Use `category: "event"` for events and `category: "blog"` for blog posts
- The filename should follow: `YYYY-MM-DD-title-goes-here.md`
- The project already filters posts by `category` and `lang` in the pages under `en/` and `pt/`

## Site data and translations

General configuration lives in:

- `_config.yml`
- `_data/settings.yml`

Translations live in:

- `_data/i18n/en.yml`
- `_data/i18n/pt.yml`

## Attributions

Thanks to [LeNPaul](https://github.com/LeNPaul/jekyll-starter-kit) for the Jekyll starter kit this project was originally based on.

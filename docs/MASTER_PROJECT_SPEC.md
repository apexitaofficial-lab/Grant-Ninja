# MASTER_PROJECT_SPEC.md

# Part 1 - Executive Summary, Product Vision & Technical Foundation

Project Name:
Grant Ninja – AI Powered Research Grants Discovery Platform

Version:
1.0

Prepared By:
Junaid Khokhar

Prepared For:
Grant Ninja

Last Updated:
August 2026

---

# 1. Executive Summary

Grant Ninja is an AI-powered research grants discovery platform designed to become the world's most comprehensive database of government and private research grants.

Unlike a traditional grants directory, Grant Ninja combines intelligent grant discovery, AI-powered content generation, advanced search capabilities, and modern SEO practices to become both a valuable user platform and an authority recognized by search engines and AI assistants.

The platform's primary purpose is to help businesses discover research grants while simultaneously promoting Grant Ninja's core financial services, which provide upfront funding against R&D tax credits and innovation grants.

The first release (MVP) will focus primarily on United States grants while being architected from day one to support additional countries such as Ireland, Australia, Canada, the UK, and many more.

The platform should be highly scalable, AI-friendly, SEO optimized, and production ready.

---

# 2. Business Vision

Grant Ninja is not simply another grant listing website.

It is intended to become the world's largest searchable database of research grants.

Every grant page should be discoverable by:

• Google Search
• Google AI Overview
• Gemini
• ChatGPT
• Claude
• Perplexity
• Bing AI

The website should become an authority on research grants.

The secondary business objective is to convert grant seekers into customers for Grant Ninja's financial services.

Throughout the website, users should naturally discover that Grant Ninja also helps businesses secure upfront cash flow against future government grants and R&D tax incentives.

---

# 3. Primary Business Goals

The project should accomplish the following:

• Build a modern searchable grants platform
• Create an AI friendly website
• Become highly visible in search engines
• Generate leads for Grant Ninja
• Automatically organize grants
• Support future automation
• Scale to 50+ countries
• Become the world's largest research grants database

---

# 4. Product Vision

Imagine combining the usability of:

• CreditIndex.org
• Stripe Documentation
• Linear.app
• Vercel
• Tailwind UI

The result should feel:

Modern

Minimal

Professional

Fast

Clean

Premium

The interface should never feel like an outdated government directory.

Instead it should feel like a premium SaaS application.

---

# 5. Inspiration

CreditIndex.org is NOT being copied.

It is being used as inspiration for:

• Information Architecture
• Search Experience
• Directory Structure
• Category Organization
• Navigation
• User Journey

Everything else should be redesigned using modern UI principles.

---

# 6. Project Scope

The MVP includes:

✔ Landing Page

✔ Marketing Website

✔ Services Page

✔ About Page

✔ Contact Page

✔ Search Engine

✔ Grants Database

✔ Grant Detail Pages

✔ Country Pages

✔ Category Pages

✔ Agency Pages

✔ Admin Dashboard

✔ AI Generated Grant Summaries

✔ AI Answer Capsules

✔ SEO

✔ Schema.org

✔ JSON-LD

✔ robots.txt

✔ sitemap.xml

✔ llms.txt

✔ Responsive Design

✔ Production Deployment

---

# 7. Out of Scope (Phase 1)

The following are intentionally excluded:

User Registration

Saved Grants

Bookmarks

Email Notifications

Grant Applications

Payments

Subscriptions

CRM

Multi-language

Mobile Applications

Analytics Dashboard

These may be added in future phases.

---

# 8. Core User Journey

Visitor arrives.

↓

Searches for grants.

↓

Applies filters.

↓

Finds grant.

↓

Reads detailed grant page.

↓

Reads AI summary.

↓

Reads answer capsules.

↓

Discovers Grant Ninja funding services.

↓

Contacts Grant Ninja.

This journey should exist on nearly every page.

---

# 9. Target Audience

Primary

• Startups
• SMEs
• Research Companies
• Universities
• Manufacturers
• Technology Companies

Secondary

• Consultants
• Grant Writers
• Innovation Advisors
• Government Contractors

---

# 10. Technology Stack

Frontend

Next.js 15 (App Router)

React 19

TypeScript

Tailwind CSS

shadcn/ui

React Hook Form

Zod

Lucide Icons

Framer Motion (lightweight)

Deployment

Hostinger VPS

Ubuntu Linux

Nginx

PM2

GitHub

Database

Supabase PostgreSQL

Supabase Authentication (Admin only)

Supabase Storage

Row Level Security

Backend Services

Python 3.12+

Virtual Environment

Playwright

BeautifulSoup4

Requests

lxml

RapidFuzz

Pydantic

Loguru

AI

Google Gemini Flash

Reason:

• Fast

• Low Cost

• Excellent JSON Output

• Large Context Window

Scheduling

Linux Cron Jobs

Daily

Weekly

Manual Execution

---

# 11. High Level System Architecture

                User
                  │
                  ▼
          Next.js Frontend
                  │
                  ▼
          Supabase Database
                  ▲
                  │
          Python Crawler
                  │
                  ▼
         Google Gemini Flash
                  │
                  ▼
      Government Grant Sources

The crawler discovers information.

Gemini structures the content.

Supabase stores the data.

Next.js displays it.

---

# 12. Scalability Goals

The architecture must support:

Unlimited Countries

Unlimited States

Unlimited Agencies

Unlimited Categories

Unlimited Grants

Unlimited Crawling Sources

Future API Integrations

Future AI Models

Future Mobile Applications

No part of the architecture should be hardcoded specifically for the USA.

Everything must be country-driven.

---

# 13. Development Principles

The project should prioritize:

Clean Code

Reusable Components

Modular Architecture

Scalability

Performance

Accessibility

SEO

AI Readability

Security

Maintainability

Developer Experience

The application should be easy for future developers to understand.

---

# 14. Coding Philosophy

Every feature should be:

Simple

Predictable

Reusable

Documented

Type Safe

Testable

Avoid quick hacks.

Avoid duplicated logic.

Favor reusable components over page-specific implementations.

---

# 15. Design Philosophy

The website should communicate trust.

Large whitespace.

Premium typography.

Professional color palette.

Minimal animations.

Fast loading.

Excellent readability.

Every page should feel like a premium SaaS product rather than a government website.

---

# 16. AI Friendly Philosophy

Every page should answer questions directly.

Every grant page should contain:

Summary

Funding

Eligibility

Deadlines

Application Steps

Frequently Asked Questions

Answer Capsules

Related Grants

Schema Markup

The goal is for AI systems such as ChatGPT, Gemini, Claude, and Google AI Overview to easily understand and reference the content.

---

# 17. Success Criteria

The MVP will be considered successful when:

✓ Users can search grants quickly.

✓ Grant pages are fully SEO optimized.

✓ Schema markup validates successfully.

✓ AI-generated summaries are displayed correctly.

✓ Grant Ninja services are promoted naturally.

✓ The system is responsive.

✓ The platform is deployable to Hostinger VPS.

✓ The architecture supports future expansion without major redesign.

---

# End of Part 1

Next Document:

MASTER_PROJECT_SPEC.md
Part 2

Information Architecture
Navigation
Complete Page Hierarchy
Complete User Flows
URL Structure
Routing
Menu System
Breadcrumb Strategy
Search Experience

---

# Part 2 – Information Architecture

This section defines the complete structure of the Grant Ninja platform.

The objective is to create a scalable architecture that supports:

• Unlimited Countries
• Unlimited States / Regions
• Unlimited Agencies
• Unlimited Categories
• Unlimited Grants

The navigation must remain simple regardless of database size.

The user should never feel overwhelmed.

---

# 18. Website Architecture

The application consists of two major areas.

Public Website

↓

Administration Portal

Both share the same database.

Both share the same API.

The Admin Portal is protected by authentication.

Visitors never require an account.

---

# 19. Website Navigation

Desktop Navigation

---

Logo

Search

Browse

Countries

Categories

Services

About

Contact

---

CTA Button

Find Grants

---

Mobile Navigation

Hamburger Menu

↓

Search

Browse

Countries

Categories

Services

About

Contact

---

# 20. Primary Navigation Structure

Grant Ninja

│

├── Home

├── Browse Grants

├── Countries

├── Categories

├── Services

├── About

├── Contact

└── Admin (Protected)

---

# 21. Complete Sitemap

/

Home

/about

About Grant Ninja

/services

Financial Services

/contact

Contact

/search

Search Results

/grants

All Grants

/grants/[slug]

Grant Detail

/countries

Country Directory

/countries/[country]

Country Detail

/countries/[country]/states

State Directory

/countries/[country]/states/[state]

State Detail

/categories

Category Directory

/categories/[slug]

Category Detail

/agencies

Agency Directory

/agencies/[slug]

Agency Detail

/admin

Dashboard

/admin/grants

Grant Management

/admin/categories

Category Management

/admin/countries

Country Management

/admin/agencies

Agency Management

/admin/crawler

Crawler Logs

/admin/settings

Settings

---

# 22. URL Design Principles

Every URL must be:

Readable

SEO Friendly

Human Friendly

Predictable

Examples

/grants/research-commercialisation-fund

NOT

/grant?id=294

Example

/categories/healthcare

NOT

/category?id=19

Example

/countries/united-states

NOT

/country?id=1

---

# 23. Dynamic Routing (Next.js)

The application will use the App Router.

Example

app/

home/

about/

services/

contact/

search/

grants/

[slug]/

countries/

[country]/

states/

[state]/

categories/

[slug]/

admin/

Every dynamic page should use Server Components by default.

---

# 24. Header Design

The header should remain visible while scrolling.

Contains

Logo

Search

Primary Navigation

CTA Button

Responsive Mobile Menu

Sticky Header

Desktop

---

Grant Ninja

Search...

Browse

Countries

Categories

Services

About

Contact

[Find Grants]

---

---

# 25. Footer Design

Footer Sections

Company

About

Services

Contact

Resources

Browse Grants

Countries

Categories

Latest Grants

Legal

Privacy Policy

Terms

Cookies

AI

Sitemap

LLMS.txt

Robots.txt

Social Icons

LinkedIn

X

Trustpilot

G2

Clutch

---

# 26. Search Experience

Search is the primary feature.

The search bar should appear:

Home Page

Header

Search Page

Grant Listing

Country Pages

Category Pages

Agency Pages

The search should feel instant.

Users should never need more than two clicks to reach a grant.

---

# 27. Search Behaviour

Users may search by

Grant Name

Agency

Funding

Keyword

Industry

Technology

State

Country

Deadline

Eligibility

Search Suggestions

Autocomplete

Popular Searches

Recent Searches (future)

---

# 28. Global Filter Sidebar

Every listing page shares the same filter system.

Countries

States

Agencies

Categories

Funding Amount

Grant Status

Deadline

Industry

Recently Added

Recently Updated

Federal

State

Private

The filter system should be reusable across the entire platform.

---

# 29. Breadcrumb Strategy

Every page must generate breadcrumbs automatically.

Example

Home

↓

Countries

↓

United States

↓

California

↓

Manufacturing Grants

↓

Grant Detail

Each breadcrumb should include structured data.

---

# 30. Navigation Principles

The user should always know

Where they are.

Where they came from.

Where they can go next.

Every page should include:

Breadcrumb

Related Pages

Related Grants

Suggested Categories

Popular Searches

---

# 31. Empty States

If no grants are found

Show

Illustration

Helpful Message

Suggested Categories

Reset Filters

Popular Grants

Users should never see an empty white page.

---

# 32. 404 Strategy

Custom 404

Search Box

Popular Categories

Browse Countries

Latest Grants

Back to Home

---

# 33. Loading Experience

Every page should include

Skeleton Cards

Loading Animation

Progressive Rendering

No layout shift

Fast perceived performance

---

# 34. User Flow

Visitor

↓

Homepage

↓

Search

↓

Grant Listing

↓

Grant Detail

↓

AI Summary

↓

Grant Ninja Services

↓

Contact

The platform should naturally encourage users to contact Grant Ninja after discovering relevant grants.

---

# Acceptance Criteria

✓ Navigation is fully responsive.

✓ URLs are SEO friendly.

✓ Header and footer are reusable.

✓ Search is globally accessible.

✓ Breadcrumbs work on every dynamic page.

✓ Empty states are user-friendly.

✓ URL structure supports unlimited countries.

✓ Navigation remains simple as the platform scales.

---

End of Part 2A

---

# Part 2B – Public Website Pages

This section defines every public-facing page of the Grant Ninja platform.

Every page must follow the same design language.

The website should feel like a premium SaaS product rather than a government directory.

Every page must be:

• Mobile First
• Responsive
• SEO Optimized
• AI Friendly
• Fast
• Accessible
• Clean
• Modern

---

## HOME PAGE

Route

/

Business Goal

Immediately communicate what Grant Ninja is and encourage users to search the grants database.

The homepage has two goals:

1. Help visitors discover grants.

2. Introduce Grant Ninja's funding services.

---

Home Page Layout

---

Sticky Navigation

↓

Hero Section

↓

Search Bar

↓

Featured Statistics

↓

Browse by Country

↓

Browse by Category

↓

Latest Grants

↓

Recently Updated Grants

↓

Featured Grants

↓

Why Grant Ninja

↓

Funding Services

↓

How It Works

↓

Frequently Asked Questions

↓

Call To Action

↓

Footer

---

Hero Section

Contains

Headline

Subheadline

Search Bar

Primary CTA

Secondary CTA

Suggested Headline

"The World's Most Extensive Research Grants Database"

Suggested Subheadline

Discover thousands of research grants from government agencies around the world while accessing funding solutions that help your business grow faster.

Buttons

Find Grants

Learn More

---

Featured Statistics

Display

Countries

States

Government Agencies

Total Grants

Recently Updated Grants

Example

50+

Countries

500+

Government Agencies

12,000+

Research Grants

Updated Weekly

These values should come from the database.

---

Browse by Country

Display country cards.

Each card contains

Country Flag

Country Name

Grant Count

Example

United States

Ireland

Australia

United Kingdom

Canada

Future countries should automatically appear.

---

Browse by Category

Display category cards.

Examples

Healthcare

Technology

Manufacturing

Artificial Intelligence

Energy

Education

Agriculture

Universities

Research

Each card links to its own page.

---

Featured Grants

Display 6–8 featured grants.

Each card includes

Grant Title

Agency

Funding Amount

Deadline

Country

Category

Short Summary

View Details Button

---

Latest Grants

Newest grants imported.

Automatically sorted by publish date.

---

Recently Updated

Display grants recently modified by AI.

---

Why Grant Ninja

Three to six cards.

Example

Largest Grant Database

Updated Weekly

AI Powered Discovery

Trusted Funding Partner

Official Government Sources

---

Funding Services

Explain

Grant Ninja helps businesses obtain upfront funding against grants and R&D tax credits.

Suggested CTA

Talk to Our Experts

---

How It Works

1

Search Grants

↓

2

Find Opportunities

↓

3

Apply

↓

4

Need Funding?

↓

5

Grant Ninja Helps

---

FAQ

Use FAQ Schema.

Examples

How often is the database updated?

Where do the grants come from?

Is the information official?

Can Grant Ninja help with funding?

---

Final CTA

Ready to discover research grants?

Start Searching

---

ABOUT PAGE

Route

/about

Goal

Explain who Grant Ninja is.

Topics

Mission

Vision

Company Story

Why Businesses Trust Us

AI-generated content is acceptable.

---

SERVICES PAGE

Route

/services

Business Goal

Generate leads.

Explain that Grant Ninja provides funding solutions.

Topics

Grant Financing

R&D Tax Credit Financing

Cash Flow Solutions

Innovation Funding

Benefits

Fast Access

Non-Dilutive Capital

Experienced Team

Call to Action

Contact Us

Book Consultation

---

CONTACT PAGE

Route

/contact

Contains

Contact Form

Business Email

Phone

Office Location

Google Map (Optional)

Business Hours

Social Links

Schema

LocalBusiness

Organization

ContactPoint

---

COUNTRIES DIRECTORY

Route

/countries

Purpose

Display all available countries.

Each country card contains

Flag

Country Name

Grant Count

Agency Count

View Country Button

Future countries should automatically appear.

---

COUNTRY DETAIL

Route

/countries/[country]

Contains

Country Overview

Statistics

Popular Categories

Popular Agencies

Grant Listing

Search

Filters

SEO Landing Content

FAQ

Related Countries

---

CATEGORY DIRECTORY

Route

/categories

Display all grant categories.

Each card contains

Category Name

Description

Grant Count

---

CATEGORY DETAIL

Route

/ categories/[slug]

Contains

Category Description

Grant Statistics

Search

Filters

Grant Listing

Related Categories

FAQ

---

AGENCY DIRECTORY

Route

/agencies

Display

Agency Logo

Agency Name

Country

Grant Count

---

AGENCY DETAIL

Route

/agencies/[slug]

Contains

Agency Overview

Official Website

Active Grants

Grant History

FAQ

Related Agencies

---

SEARCH PAGE

Route

/search

Contains

Search Input

Advanced Filters

Results Grid

Pagination

Sorting

No Results State

Suggested Searches

---

GRANTS DIRECTORY

Route

/grants

Purpose

Display every available grant.

Supports

Pagination

Sorting

Search

Filters

Grid/List Toggle

---

GRANT DETAIL PAGE

Route

/grants/[slug]

This is the most important page in the application.

Every grant page should become an AI-friendly landing page.

---

Layout

Breadcrumb

↓

Grant Header

↓

Funding Summary

↓

AI Summary

↓

Answer Capsules

↓

Eligibility

↓

Funding Details

↓

Application Process

↓

Required Documents

↓

Important Dates

↓

Official Source

↓

Related Grants

↓

FAQ

↓

Grant Ninja CTA

---

Grant Header

Contains

Grant Title

Agency

Country

State

Funding Amount

Deadline

Status

Category

---

AI Summary

Generated using Gemini.

Approximately 150–300 words.

Human readable.

---

Answer Capsules

Short answers.

Examples

What is this grant?

Who is eligible?

How much funding is available?

When is the deadline?

How do I apply?

Can startups apply?

These should be optimized for AI search engines.

---

Funding Details

Grant Amount

Maximum Funding

Minimum Funding

Funding Type

Matching Required

---

Eligibility

Who can apply

Industries

Business Size

Research Type

Requirements

---

Application Process

Step-by-step guide.

---

Required Documents

Display checklist.

---

Important Dates

Open Date

Deadline

Expected Decision

---

Official Source

Link to government website.

Last Verified Date.

---

Related Grants

Based on

Category

Agency

Country

Industry

---

Grant Ninja CTA

Need funding before your grant is approved?

Talk to Grant Ninja.

---

Every public page must contain

SEO Metadata

OpenGraph

Twitter Card

Canonical URL

Structured Data

Responsive Design

Accessibility

Fast Loading

Internal Linking

---

# Part 2C – Design System & UI/UX Specification

This section defines the visual identity, user experience, reusable components, and interaction patterns for Grant Ninja.

The design philosophy is inspired by:

- Vercel
- Stripe
- Linear
- Notion
- Tailwind UI

The objective is to build a platform that feels modern, trustworthy, and enterprise-grade while remaining simple to use.

---

# 35. Design Principles

Every page should follow these principles:

- Clean and uncluttered
- Large whitespace
- Fast loading
- Professional typography
- Consistent spacing
- Minimal but meaningful animations
- Accessible
- Mobile-first
- Easy to scan
- SEO-friendly

The website should feel like premium SaaS software rather than a government directory.

---

# 36. Visual Identity

The UI should communicate:

- Trust
- Professionalism
- Innovation
- Simplicity
- Speed

Avoid:

❌ Busy layouts

❌ Too many colors

❌ Heavy shadows

❌ Large gradients

❌ Overly animated interfaces

---

# 37. Layout System

Use a centered responsive container.

Desktop

Maximum Width

1400px

Content Width

1280px

Tablet

100%

Mobile

100%

Padding

Desktop

32px

Tablet

24px

Mobile

16px

---

# 38. Grid System

Desktop

12 Columns

Tablet

8 Columns

Mobile

4 Columns

Cards should automatically wrap.

Never horizontally scroll.

---

# 39. Spacing System

Use an 8-point spacing system.

Examples

4

8

12

16

24

32

40

48

64

96

128

Avoid arbitrary spacing.

---

# 40. Border Radius

Cards

16px

Buttons

12px

Inputs

12px

Badges

999px

Dialogs

20px

---

# 41. Shadows

Keep shadows minimal.

Use only three elevations.

Low

Cards

Medium

Dropdowns

High

Modals

Never use exaggerated shadows.

---

# 42. Typography

Font

Inter

Fallback

System Sans

Hierarchy

H1

48px

H2

40px

H3

32px

H4

24px

H5

20px

Body

16px

Small

14px

Caption

12px

Typography should prioritize readability.

---

# 43. Color Palette

Primary

Blue

Secondary

Slate

Accent

Emerald

Success

Green

Warning

Amber

Danger

Red

Background

White

Dark Text

Slate 900

Muted Text

Slate 500

Avoid overly colorful interfaces.

---

# 44. Buttons

Primary

Solid Blue

Secondary

Outline

Ghost

Minimal

Danger

Red

Every button should include

Hover

Focus

Loading

Disabled

States

---

# 45. Inputs

Rounded

12px

Include

Label

Placeholder

Validation

Helper Text

Error State

Focus Ring

Autocomplete where appropriate.

---

# 46. Cards

Cards are the primary UI pattern.

Every card should include

Padding

Rounded Corners

Subtle Shadow

Hover Elevation

Responsive Layout

Card Types

Grant Card

Country Card

Category Card

Agency Card

Statistic Card

Feature Card

FAQ Card

Service Card

---

# 47. Icons

Use

Lucide React

Consistent stroke width.

Avoid mixing icon libraries.

---

# 48. Animations

Use Framer Motion sparingly.

Allowed

Fade

Slide

Scale

Accordion

Number Counter

Avoid

Parallax

Heavy Motion

Large Delays

---

# 49. Loading States

Every asynchronous component must display

Skeleton Loader

Spinner (only when appropriate)

Progress Indicator

No layout shift should occur.

---

# 50. Empty States

Every empty page should contain

Illustration

Helpful Message

Primary CTA

Secondary CTA

Examples

No grants found

Try another keyword

Browse Categories

Reset Filters

---

# 51. Error States

Every error should explain

What happened

Why

How to fix it

Retry Button

Contact Support Link

---

# 52. Responsive Design

Mobile First

Supported Breakpoints

Mobile

Tablet

Laptop

Desktop

Large Desktop

Navigation should collapse gracefully.

Tables should become cards on smaller screens.

---

# 53. Accessibility

Meet WCAG AA standards.

Requirements

Keyboard Navigation

Screen Reader Support

ARIA Labels

Visible Focus States

Color Contrast

Semantic HTML

Skip Navigation Link

---

# 54. Reusable Components

The following components should be reusable throughout the application.

Navigation Bar

Footer

Container

Section Header

Hero

Search Bar

Advanced Filters

Grant Card

Country Card

Category Card

Agency Card

Statistic Card

Badge

Breadcrumb

Pagination

Accordion

FAQ

CTA Banner

Empty State

Loading Skeleton

Error Message

Modal

Drawer

Dropdown

Tabs

Tooltip

Toast

Confirmation Dialog

Data Table

Status Badge

Avatar

Logo

Social Links

Share Buttons

Newsletter (Future)

Every component must be independent and reusable.

---

# 55. Search Experience

Search is the most important interaction.

Requirements

Instant response

Keyboard accessible

Autocomplete

Suggestions

Popular Searches

Recent Searches (Future)

Clear Button

Search should be available globally.

---

# 56. Filter Experience

Filters should update results instantly.

Supported Filters

Country

State

Agency

Category

Industry

Funding Amount

Grant Status

Deadline

Recently Added

Recently Updated

Federal

State

Private

Filters should remain visible on desktop.

Filters collapse into a drawer on mobile.

---

# 57. Grant Card Specification

Each Grant Card displays

Grant Title

Agency

Country

State

Funding Amount

Deadline

Category

Status

Short Summary

View Details Button

Optional

Featured Badge

Recently Updated Badge

Closing Soon Badge

Cards should maintain consistent height.

---

# 58. Statistics Cards

Used throughout homepage and admin.

Contains

Icon

Metric

Label

Optional Trend

Animated Counter

---

# 59. CTA Components

Reusable CTA banner.

Example

Ready to secure funding?

Talk to Grant Ninja today.

Buttons

Contact Us

Learn More

Used across

Homepage

Grant Pages

Services

About

Country Pages

Category Pages

---

# 60. Design Consistency Rules

Every page must use

Same spacing

Same typography

Same buttons

Same cards

Same animations

Same loading states

Same error states

No page should introduce its own design language.

---

# Acceptance Criteria

✓ Responsive on all screen sizes

✓ Accessible

✓ Consistent spacing

✓ Reusable components

✓ Premium SaaS appearance

✓ Fast loading

✓ Smooth interactions

✓ Clean typography

✓ Modern UI

✓ Production ready

---

End of Part 2C

---

# Part 3A – Database Architecture

This section defines the complete relational database architecture.

The database must be designed for:

• Scalability
• Performance
• Maintainability
• AI Processing
• Multi-country support
• Future integrations

Supabase PostgreSQL will be used.

Every table should include

UUID Primary Key

Created At

Updated At

Soft Delete Support

Indexes

Foreign Keys

Audit Ready

---

# Database Design Principles

The database should never be tightly coupled to one country.

The architecture must support

Unlimited Countries

Unlimited States

Unlimited Organizations

Unlimited Categories

Unlimited Grants

Unlimited AI Generated Content

Unlimited Crawling Sources

---

# High Level Entity Relationship

Country

↓

Region / State

↓

Organization

↓

Grant

↓

Grant AI Content

↓

Crawler History

---

# Core Tables

countries

states

organizations

grant_categories

grants

grant_ai_content

crawler_sources

crawler_runs

grant_documents

faq_items

contact_messages

admin_users

system_settings

audit_logs

---

# countries

Purpose

Stores supported countries.

Columns

id

uuid

name

slug

iso_code

flag_url

currency

timezone

status

grant_count

created_at

updated_at

Indexes

slug

iso_code

Unique

slug

Future

Language

Government Portal

National Website

---

# Example

United States

Ireland

Australia

Canada

United Kingdom

Germany

France

---

# states

Purpose

Stores states, provinces or regions.

Examples

California

Texas

Queensland

Ontario

Dublin

Columns

id

country_id

name

slug

code

status

created_at

updated_at

Relationship

Many States

↓

One Country

---

# organizations

Purpose

Represents the organization that owns the grant.

This can be

Government Department

Innovation Agency

Research Council

University

Private Foundation

Grant Provider

Examples

National Science Foundation

NASA

NIH

Department of Energy

Enterprise Ireland

Columns

id

country_id

state_id (optional)

name

slug

organization_type

website

logo

description

email

phone

address

status

created_at

updated_at

Organization Types

Government

Federal

State

University

Private

Research Council

Innovation Agency

Foundation

---

# grant_categories

Purpose

Stores categories.

Examples

Technology

Healthcare

Manufacturing

AI

Energy

Agriculture

Education

Columns

id

name

slug

description

icon

color

status

created_at

updated_at

---

# grants

Purpose

Main table.

This table stores every grant.

Columns

id

organization_id

country_id

state_id

category_id

title

slug

short_description

full_description

funding_amount

minimum_amount

maximum_amount

currency

grant_type

status

eligibility

application_url

official_url

opens_at

closes_at

published_at

last_verified_at

featured

is_federal

is_private

is_active

source_url

hash

created_at

updated_at

Important

Slug

Must always be unique.

Hash

Used by crawler to detect content changes.

---

# grant_ai_content

Purpose

Stores AI generated information.

This table is separated intentionally.

Reason

Allows regeneration without modifying grant data.

Columns

id

grant_id

summary

answer_capsules

faq

seo_title

seo_description

keywords

structured_json

last_generated_at

model_used

token_usage

created_at

updated_at

---

# crawler_sources

Purpose

Stores every website the crawler monitors.

Columns

id

name

base_url

country_id

organization_id

crawl_type

frequency

priority

status

last_run

created_at

updated_at

Examples

grants.gov

nsf.gov

energy.gov

enterprise-ireland.com

---

# crawler_runs

Purpose

Stores crawler history.

Columns

id

source_id

started_at

completed_at

duration

pages_scanned

new_grants

updated_grants

duplicates

errors

status

logs

created_at

This becomes the admin activity history.

---

# grant_documents

Purpose

Stores downloadable documents.

Examples

PDF

DOC

Application Guide

Columns

id

grant_id

title

file_url

document_type

created_at

---

# faq_items

Purpose

Stores reusable FAQs.

Can belong to

Grant

Country

Category

Service

Columns

id

entity_type

entity_id

question

answer

sort_order

created_at

---

# contact_messages

Purpose

Stores website enquiries.

Columns

id

name

email

phone

company

subject

message

status

created_at

---

# admin_users

Purpose

Admin authentication.

Handled through Supabase Auth.

Extra Profile

role

avatar

display_name

status

created_at

updated_at

Roles

Super Admin

Admin

Editor

---

# system_settings

Purpose

Stores application configuration.

Examples

Homepage Title

SEO

Gemini Model

Crawler Frequency

Organization Information

SameAs Links

Schema Configuration

Social Media

---

# audit_logs

Purpose

Track admin changes.

Examples

Grant Edited

Grant Deleted

Crawler Started

AI Generated

Admin Login

Columns

id

user_id

action

entity

entity_id

old_data

new_data

created_at

---

# Relationships

Country

↓

Many States

↓

Many Organizations

↓

Many Grants

↓

One AI Record

↓

Many Documents

---

# Indexing Strategy

Indexes

slug

country_id

state_id

category_id

organization_id

status

deadline

funding_amount

published_at

Hash

Reason

Fast Search

Fast Filtering

Crawler Performance

---

# Soft Delete

Every important table should support

deleted_at

Never permanently delete grants.

Archive instead.

---

# Search Optimization

Create indexes for

Grant Name

Organization

Country

Category

Deadline

Funding

Eligibility

Future

PostgreSQL Full Text Search

pgvector (optional)

---

# Acceptance Criteria

✓ Fully normalized

✓ Future proof

✓ Unlimited countries

✓ Unlimited organizations

✓ AI ready

✓ SEO ready

✓ Optimized for Supabase

✓ Optimized for crawler

✓ Ready for future mobile apps

---

End of Part 3A

---

# Part 3B – Advanced Database Architecture

This section extends the database architecture with AI, SEO, crawling,
versioning and future scalability.

The objective is to ensure that no future redesign is required when the
platform grows to hundreds of thousands of grants.

---

# Database Philosophy

Grant Ninja should be treated as a knowledge platform rather than a simple CRUD application.

Every grant has:

Business Data

↓

Crawler Data

↓

AI Content

↓

SEO Content

↓

History

↓

Analytics (Future)

Keeping these separated makes regeneration and updates significantly easier.

---

# grant_versions

Purpose

Maintain historical snapshots of grants.

Whenever the crawler detects a meaningful change, a new version is created.

Benefits

Historical comparison

Rollback support

Audit trail

AI retraining

Columns

id

grant_id

version_number

title

description

eligibility

funding_amount

deadline

application_url

raw_content

hash

created_at

Rules

Never edit old versions.

Always create a new version.

Only the latest version is considered active.

---

# grant_sources

Purpose

Store every source used to create or update a grant.

A single grant may originate from multiple sources.

Examples

Official Government Website

Government PDF

RSS Feed

Research Portal

Private Foundation

Columns

id

grant_id

source_name

source_url

source_type

confidence_score

last_checked

created_at

Source Types

Official Website

RSS

PDF

API (Future)

Manual

Crawler

---

# grant_seo

Purpose

Store SEO content independently.

Reason

SEO changes frequently.

AI summaries should not overwrite metadata.

Columns

id

grant_id

meta_title

meta_description

canonical_url

focus_keywords

open_graph_title

open_graph_description

twitter_title

twitter_description

json_ld

robots

schema_version

updated_at

---

# grant_faq

Purpose

Grant-specific FAQ.

Generated using Gemini.

Examples

Who can apply?

Can startups apply?

How much funding is available?

When is the deadline?

How long does approval take?

Columns

id

grant_id

question

answer

sort_order

created_at

---

# grant_answer_capsules

Purpose

Very short AI-generated answers.

These are optimized for:

Google AI Overview

Gemini

Claude

ChatGPT

Perplexity

Example

Question

What is this grant?

↓

Answer

A federal grant supporting AI research projects for SMEs.

Columns

id

grant_id

question

answer

position

created_at

---

# grant_tags

Purpose

Tags improve discovery.

Categories are hierarchical.

Tags are flexible.

Examples

AI

Machine Learning

Clean Energy

Women-Owned

Export

Manufacturing

Defence

Robotics

Health

University

Grant

↓

Many Tags

Columns

id

name

slug

color

created_at

---

# grant_tag_relations

Many-to-many relationship.

Columns

grant_id

tag_id

---

# grant_history

Purpose

Maintain crawler activity history.

Examples

Grant Created

Grant Updated

Grant Closed

Deadline Changed

Funding Increased

AI Regenerated

Columns

id

grant_id

action

description

performed_by

performed_by_type

created_at

performed_by_type

Crawler

Admin

AI

System

---

# ai_generation_logs

Purpose

Track every Gemini request.

Benefits

Debugging

Cost Monitoring

Prompt Improvements

Columns

id

grant_id

model

prompt_version

tokens_input

tokens_output

execution_time

status

error_message

created_at

---

# crawler_queue

Purpose

Queue crawl jobs.

Supports future scaling.

Columns

id

source_id

priority

status

scheduled_for

started_at

completed_at

retry_count

error

created_at

Status

Pending

Running

Completed

Failed

Cancelled

---

# crawler_pages

Purpose

Track every crawled page.

Examples

Grant Page

Category Page

Agency Page

Columns

id

source_id

url

hash

status

last_crawled

last_modified

http_status

created_at

Reason

Avoid crawling unchanged pages.

---

# duplicate_detection

Purpose

Track duplicate grants.

Uses

RapidFuzz

Hash Comparison

Gemini Validation

Columns

id

grant_a

grant_b

confidence

decision

resolved

created_at

Decision

Duplicate

Possible Duplicate

Different

---

# search_index

Purpose

Optimized search.

Contains

Grant Title

Summary

Keywords

Category

Organization

Country

Tags

Funding

Deadline

Future

PostgreSQL Full Text Search

pgvector

Hybrid Search

---

# schema_markup

Purpose

Store generated structured data.

Reason

Can regenerate independently.

Contains

Organization Schema

Grant Schema

FAQ Schema

Breadcrumb Schema

Website Schema

SearchAction Schema

Columns

id

entity_type

entity_id

schema_json

schema_version

created_at

---

# same_as_profiles

Purpose

Store company profiles.

Examples

LinkedIn

Trustpilot

G2

Clutch

Crunchbase

YouTube

Used for

Organization Schema

Columns

id

platform

url

display_order

enabled

created_at

---

# seo_redirects

Purpose

Manage redirects.

Examples

Old URL

↓

New URL

Supports

301

302

Columns

id

source

destination

type

created_at

---

# media_library

Purpose

Store uploaded assets.

Images

Logos

PDF

Icons

Documents

Columns

id

file_name

file_path

mime_type

size

uploaded_by

created_at

---

# Future Tables

Not required for MVP.

bookmark_grants

email_alerts

saved_searches

analytics_events

notification_queue

api_keys

countries_languages

translations

vector_embeddings

grant_similarity

---

# Data Lifecycle

Crawler

↓

Extract

↓

Normalize

↓

Duplicate Check

↓

AI Processing

↓

SEO Generation

↓

Database Update

↓

Search Index

↓

Website

Every step should be logged.

Nothing should silently fail.

---

# Database Performance

Requirements

Indexes

Foreign Keys

Constraints

UUID Keys

Connection Pooling

Optimized Queries

Pagination

No N+1 Queries

---

# Backup Strategy

Daily Database Backup

Weekly Full Backup

Monthly Archive

Point-in-Time Recovery (Future)

---

# Acceptance Criteria

✓ Supports millions of grants

✓ Supports unlimited countries

✓ AI ready

✓ SEO ready

✓ Version controlled

✓ Fully auditable

✓ Highly normalized

✓ Future proof

✓ Enterprise grade

---

End of Part 3B

---

# Part 4A – AI Data Pipeline & Python Service

This section defines the architecture for the Grant Ninja AI Data Pipeline.

The pipeline is responsible for automatically discovering, extracting,
understanding, validating, and publishing grant information.

This is NOT simply a web scraper.

It is an AI-assisted ETL (Extract → Transform → Load) system.

The objective is to minimize manual work while ensuring high-quality,
structured, and searchable grant data.

---

# Core Responsibilities

The Python service is responsible for:

- Discovering new grant pages
- Monitoring existing grant pages
- Detecting content changes
- Extracting structured information
- Using AI to understand content
- Validating extracted data
- Detecting duplicates
- Updating the database
- Regenerating AI summaries
- Regenerating SEO content
- Logging every operation

---

# High-Level Pipeline

Scheduler
↓
Discovery
↓
Fetch
↓
Extraction
↓
Normalization
↓
AI Processing
↓
Validation
↓
Duplicate Detection
↓
Database Update
↓
SEO Generation
↓
Publish

Every stage should be modular and independently testable.

---

# Recommended Technology Stack

Language

Python 3.12+

Core Libraries

Playwright
BeautifulSoup4
Requests
lxml
RapidFuzz
Pydantic
Loguru
python-dotenv

AI

Google Gemini Flash

Database

Supabase PostgreSQL

Scheduling

Linux Cron

Future

Redis Queue
Celery
RabbitMQ

---

# Folder Structure

crawler/

    config/

    core/

    discovery/

    fetchers/

    extractors/

    parsers/

    normalizers/

    ai/

    validators/

    duplicate_detection/

    publishers/

    seo/

    scheduler/

    database/

    prompts/

    logging/

    monitoring/

    utils/

    tests/

Each directory has a single responsibility.

---

# Pipeline Philosophy

Every stage receives structured input and produces structured output.

No stage should directly modify database records.

Each stage should be replaceable without affecting the rest of the pipeline.

---

# Configuration

Use a centralized configuration module.

Environment Variables

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

GEMINI_API_KEY

USER_AGENT

LOG_LEVEL

DEFAULT_COUNTRY

CRAWL_TIMEOUT

MAX_RETRIES

REQUEST_DELAY

HEADLESS_BROWSER

Never hardcode secrets.

---

# Logging

Every stage must log:

Start Time

End Time

Duration

Success

Failure

Warnings

Retries

Pages Processed

Grants Added

Grants Updated

Duplicates Found

AI Calls

Token Usage

Logs should be searchable.

---

# Error Handling

Every failure should:

Log the error

Retry (where appropriate)

Continue processing other tasks

Never terminate the full pipeline because one page failed.

---

# Retry Strategy

Network Failure

Retry 3 Times

Gemini Timeout

Retry 2 Times

Page Load Failure

Retry with Playwright

Database Failure

Retry Transaction

After maximum retries

Move to Failed Queue

---

# Pipeline Stages

1. Discovery

Purpose

Find URLs that should be crawled.

Input

Configured Sources

Output

Queue of URLs

Example Sources

Government Websites

Agency Listings

Grant Portals

RSS Feeds

Static Lists

---

# Stage 2 – Fetch

Purpose

Download page content.

Preferred Method

Requests

Fallback

Playwright

Store

Raw HTML

HTTP Status

Headers

Last Modified

ETag (if available)

Hash

---

# Stage 3 – Extraction

Purpose

Extract visible content.

Ignore

Navigation

Cookies

Ads

Footers

Focus

Main Content

Tables

Grant Details

Eligibility

Deadlines

Funding

Application Links

---

# Stage 4 – Normalization

Convert extracted data into a common format.

Example

Date Formats

Currencies

Whitespace

Line Breaks

Phone Numbers

URLs

Country Names

Everything should become consistent before AI processing.

---

# Stage 5 – AI Processing

Gemini receives normalized content.

Gemini returns:

Title

Summary

Eligibility

Funding

Deadline

Category

Industry

Keywords

FAQ

Answer Capsules

Confidence Score

Structured JSON

The AI should never write directly to the database.

---

# Stage 6 – Validation

Validate:

Dates

Funding

URLs

Required Fields

Slug

Country

Category

Reject incomplete records.

---

# Stage 7 – Duplicate Detection

Methods

Hash Comparison

RapidFuzz

Gemini Semantic Validation

Rules

Exact Duplicate

Merge

Near Duplicate

Manual Review

Different Grant

Create New

---

# Stage 8 – Database Publishing

Insert New Grant

or

Update Existing Grant

Every change must be logged.

Version history must be maintained.

---

# Stage 9 – SEO Generation

Generate:

SEO Title

Meta Description

OpenGraph

JSON-LD

FAQ Schema

Grant Schema

Breadcrumb Schema

Answer Capsules

Internal Links

---

# Scheduler

Cron Jobs

Daily

Weekly

Manual Run

The scheduler should support running a single source or all sources.

---

# Monitoring

The system should expose:

Last Successful Run

Last Failed Run

Average Duration

Pages Crawled

Grants Added

Grants Updated

AI Usage

Token Consumption

Errors

These metrics will be displayed in the Admin Dashboard.

---

# Acceptance Criteria

✓ Modular architecture

✓ Replaceable pipeline stages

✓ AI integrated

✓ Detailed logging

✓ Retry support

✓ Validation before publishing

✓ Duplicate detection

✓ Version history

✓ Production ready

---

End of Part 4A

---

# Part 4B – Intelligent Crawling & AI Processing

The Python service should behave as an intelligent data pipeline rather than
a traditional scraper.

The objective is to reliably transform unstructured web content into a clean,
structured knowledge base.

---

# 1. Source Adapter Architecture

Every data source should be implemented as an independent adapter.

Adapters isolate website-specific logic from the main crawler.

Example

Government Website

↓

GovernmentAdapter

↓

Standard Output

Benefits

• Easier maintenance

• Better testing

• Easy to add new countries

• No duplicated code

Folder Structure

crawler/

    sources/

        grants_gov/

        nsf/

        nih/

        doe/

        enterprise_ireland/

        generic/

Every source contains

adapter.py

parser.py

config.py

selectors.py

README.md

---

# 2. Discovery Engine

Purpose

Find pages that should be crawled.

Discovery Methods

Static URLs

Sitemaps

Government Listings

Category Pages

Search Pages

Pagination

RSS Feeds

Future API Integration

The discovery stage should avoid crawling the same page repeatedly.

---

# 3. URL Queue

Every discovered URL enters a queue.

Queue Status

Pending

Running

Completed

Failed

Ignored

Duplicate

Priority

High

Medium

Low

Government sources should receive higher priority.

---

# 4. Fetch Strategy

Preferred

Requests

Fallback

Playwright

Fallback 2

Manual Review

Store

HTML

Headers

Cookies

Response Time

Status Code

Redirect Chain

Hash

---

# 5. Playwright Strategy

Playwright is only used when necessary.

Use Cases

JavaScript Websites

Lazy Loaded Content

Infinite Scroll

Cookie Dialogs

Bot Detection

Dynamic Rendering

Avoid using Playwright for every page.

It is slower and consumes more resources.

---

# 6. Content Cleaning

Before AI processing remove

Navigation

Headers

Footers

Advertisements

Cookie Banners

Tracking Scripts

Hidden Content

Keep

Main Content

Tables

Grant Details

Eligibility

Funding

Application Links

Requirements

Clean Markdown

Clean Text

Structured HTML

---

# 7. AI Extraction Strategy

Gemini should receive only meaningful content.

Never send the entire HTML document.

Input

Normalized Content

Expected Output

JSON Only

Example Fields

Title

Summary

Funding

Eligibility

Country

State

Organization

Category

Deadline

Opening Date

Official URL

Application URL

Documents

Keywords

Confidence Score

Reasoning

If Gemini returns invalid JSON

Retry once.

If still invalid

Flag for review.

---

# 8. Confidence Scoring

Every extraction should include confidence.

Range

0–100

Example

95

Official Government Page

82

Structured Content

67

Semi Structured Content

45

Unclear Page

Low confidence records should be reviewed by an administrator.

---

# 9. Duplicate Detection

Methods

Hash Comparison

↓

Title Similarity

↓

RapidFuzz

↓

Gemini Semantic Comparison

↓

Decision

Possible Outcomes

New Grant

Update Existing

Merge

Manual Review

Never create duplicate records.

---

# 10. Change Detection

Before AI processing

Generate SHA256 hash.

Compare with previous crawl.

If unchanged

Skip AI

Skip Database

Skip SEO

This dramatically reduces AI costs.

---

# 11. Rate Limiting

Every source should define

Maximum Requests

Delay

Concurrent Workers

Retry Delay

Respect robots.txt where appropriate.

Avoid excessive requests.

---

# 12. Robots & Ethics

The crawler should

Respect robots.txt when applicable

Use a descriptive User-Agent

Throttle requests

Avoid overloading servers

Prioritize official public information

---

# 13. Caching

Store

HTML

Normalized Text

AI Response

JSON Output

Hashes

Cache prevents unnecessary AI requests.

---

# 14. AI Prompt Versioning

Every prompt should have a version.

Example

v1

v2

v3

Store version with generated data.

Allows future regeneration.

---

# 15. AI Validation

After Gemini returns JSON

Validate using Pydantic.

Reject

Missing Fields

Invalid Dates

Broken URLs

Negative Funding

Unknown Country

Unknown Category

Only valid data reaches the database.

---

# 16. SEO Generation

Generate automatically

Meta Title

Meta Description

Slug

Canonical URL

OpenGraph

FAQ Schema

Grant Schema

Breadcrumb Schema

Keywords

Related Topics

Everything stored separately.

---

# 17. Notification Pipeline

Notify Admin When

New Grant

Updated Grant

Crawler Failure

AI Failure

Duplicate Detected

Manual Review Required

Notifications should appear in the Admin Dashboard.

Future

Email

Slack

Discord

---

# 18. Performance Targets

Average Crawl

< 2 seconds per page

Average AI Call

< 5 seconds

Database Insert

< 500 ms

Duplicate Detection

< 100 ms

Search Index Update

< 1 second

---

# 19. Failure Recovery

Every stage should recover independently.

If one page fails

Continue remaining pages.

If AI fails

Retry

If database fails

Rollback transaction

Log everything.

Never silently ignore failures.

---

# 20. Deployment Strategy

The Python service should run on the client's Hostinger VPS.

Environment

Ubuntu Linux

Python Virtual Environment

Cron Jobs

Git Repository

Logs Directory

The crawler should be executable using

python main.py

or

python run_pipeline.py

Cron Example

Daily

0 2 \* \* \*

Weekly

0 3 \* \* 0

No third-party scheduler is required.

---

# 21. Monitoring Dashboard

Expose metrics for the Admin Panel

Sources

Last Crawl

Pages Crawled

New Grants

Updated Grants

Duplicates

AI Calls

Tokens Used

Average Duration

Failed Jobs

Last Error

These metrics should be stored for historical reporting.

---

# 22. Acceptance Criteria

✓ Source adapters are modular

✓ Discovery avoids duplicate URLs

✓ Playwright used only when required

✓ HTML cleaned before AI

✓ AI receives normalized content only

✓ Hash-based change detection implemented

✓ Duplicate detection combines multiple strategies

✓ Pydantic validates all AI responses

✓ SEO generated automatically

✓ Full logging and monitoring available

✓ Ready for Hostinger VPS deployment

---

End of Part 4B

---

# Part 5A – Admin Dashboard & Operations Center

The Grant Ninja administration panel is not a traditional CRUD dashboard.

It is the operational control center for the entire platform.

Administrators should immediately understand:

• System Health

• AI Health

• Crawling Status

• Database Status

• SEO Status

• Pending Reviews

• User Activity

Everything important should be visible from one screen.

---

# 1. Admin Objectives

The admin panel should allow administrators to:

Manage Grants

Monitor AI

Monitor Crawlers

Review AI Suggestions

Approve Changes

Track Errors

Monitor Growth

Manage SEO

Manage Website Content

Configure System Settings

---

# 2. Authentication

Authentication will use:

Supabase Auth

Supported Roles

Super Admin

Admin

Editor

Viewer (Future)

Only authenticated users can access:

/admin/\*

---

# 3. Admin Layout

---

Sidebar

↓

Top Navigation

↓

Dashboard Content

---

Sidebar Items

Dashboard

Grants

Countries

States

Organizations

Categories

Crawler

AI Center

SEO

Media

Pages

Messages

Users

Settings

Audit Logs

---

# 4. Dashboard Home

Purpose

Provide an overview of the platform.

Widgets

Total Grants

Countries

Organizations

Crawler Status

AI Usage

Pending Reviews

Duplicates

Failed Crawls

SEO Score

Recent Activity

Quick Actions

---

# 5. Dashboard Charts

Charts

New Grants

Updated Grants

Crawler Performance

AI Usage

Growth

Traffic (Future)

Database Growth

Charts should support:

7 Days

30 Days

90 Days

1 Year

---

# 6. Quick Actions

Buttons

Run Crawler

Generate AI Content

Create Grant

Import Data

Export Data

View Logs

System Settings

---

# 7. Grant Management

Route

/admin/grants

Capabilities

Create

Read

Update

Delete

Archive

Duplicate

Publish

Unpublish

Bulk Actions

Grant Table Columns

Title

Country

Organization

Category

Funding

Deadline

Status

Last Updated

Actions

---

# 8. Grant Editor

Tabs

Overview

Funding

Eligibility

Documents

AI Content

SEO

History

Settings

Every section should autosave where appropriate.

---

# 9. Country Management

Manage

Countries

Flags

SEO

Descriptions

Grant Counts

Visibility

---

# 10. State Management

Manage

States

Regions

Provinces

Grant Counts

Status

---

# 11. Organization Management

Manage

Government Agencies

Private Organizations

Universities

Research Councils

Each organization contains:

Logo

Website

Description

Country

State

Status

---

# 12. Category Management

Manage

Categories

Icons

Descriptions

SEO

Visibility

Sort Order

---

# 13. AI Operations Center

Purpose

Monitor every AI process.

Widgets

AI Requests

Average Response Time

Failed Requests

Token Usage

Prompt Version

Confidence Scores

Recent AI Activity

Buttons

Regenerate Summary

Regenerate FAQ

Regenerate SEO

Regenerate Answer Capsules

---

# 14. AI Review Queue

Purpose

Review low-confidence AI outputs.

Columns

Grant

Confidence

Reason

AI Version

Actions

Approve

Reject

Edit

Regenerate

---

# 15. Crawler Center

Purpose

Monitor crawler health.

Display

Configured Sources

Running Jobs

Queued Jobs

Failed Jobs

Completed Jobs

Buttons

Run Now

Pause

Resume

Retry

---

# 16. Source Management

Each source displays

Website

Country

Frequency

Status

Last Run

Pages Crawled

Average Duration

Errors

Buttons

Edit

Run

Disable

Delete

---

# 17. Crawl History

Columns

Date

Source

Duration

Pages

New Grants

Updated Grants

Errors

Status

View Details

---

# 18. Duplicate Review

Display possible duplicates.

Columns

Grant A

Grant B

Similarity

Decision

Buttons

Merge

Keep Separate

Ignore

---

# 19. SEO Center

Purpose

Monitor SEO health.

Widgets

Missing Meta

Missing Schema

Broken Links

Missing Images

Missing FAQs

Missing AI Summary

Buttons

Generate SEO

Generate Schema

Validate Pages

---

# 20. Media Library

Manage

Images

PDF

Documents

Icons

Logos

Search

Folders

Upload

Delete

Replace

---

# 21. Marketing Pages

Editable Pages

Home

About

Services

Contact

Privacy

Terms

FAQ

Editors should support:

Markdown

Rich Text

AI Assist

Preview

---

# 22. Contact Messages

Columns

Name

Email

Subject

Status

Received

Reply

Archive

---

# 23. User Management

Manage

Users

Roles

Permissions

Status

Last Login

Future

Two Factor Authentication

---

# 24. Settings

General

Organization

SEO

Schema

Crawler

Gemini

Emails

Social Links

SameAs

Branding

Analytics (Future)

---

# 25. Audit Logs

Track every action.

Examples

Grant Created

Grant Updated

Crawler Started

Crawler Failed

AI Generated

SEO Generated

Admin Login

Settings Updated

Columns

User

Action

Entity

Timestamp

IP Address

---

# 26. System Health

Widgets

Database Status

Supabase Status

Crawler Status

Gemini Status

Disk Usage

Memory Usage

Queue Length

Errors

Everything should update in real time where possible.

---

# 27. Notifications

Admin should receive notifications for:

New Grant

Updated Grant

Crawler Failure

AI Failure

Duplicate Detected

Manual Review Needed

System Error

Future

Email

Slack

Discord

---

# 28. Search

Global Admin Search

Search everything.

Grants

Countries

Organizations

Users

Logs

Messages

Categories

Settings

---

# 29. Permissions

Super Admin

Full Access

Admin

Operational Access

Editor

Content Only

Viewer

Read Only

Future

Custom Permissions

---

# 30. Acceptance Criteria

✓ Dashboard loads quickly

✓ All CRUD operations work

✓ AI can be monitored

✓ Crawler can be managed

✓ SEO health visible

✓ Logs searchable

✓ Duplicate workflow operational

✓ Responsive

✓ Accessible

✓ Production Ready

---

End of Part 5A

---

# Part 5B – Admin Workflows & Business Logic

This section defines how administrators interact with the system.

The objective is to ensure every important operation follows a predictable,
auditable workflow.

The platform should avoid direct destructive actions whenever possible.

Everything important should be traceable.

---

# 31. Grant Lifecycle

Every grant follows a lifecycle.

Draft

↓

Pending Review

↓

Published

↓

Updated

↓

Archived

↓

Expired

↓

Deleted (Soft Delete)

Rules

Only Published grants appear on the public website.

Archived grants remain searchable internally.

Expired grants remain accessible for historical reference.

---

# 32. AI Generated Content Workflow

Crawler discovers page

↓

Content extracted

↓

Gemini generates content

↓

Confidence calculated

↓

Validation

↓

If confidence >= threshold

Auto Publish

Else

Move to Review Queue

Administrators may

Approve

Reject

Edit

Regenerate

---

# 33. Manual Grant Creation

Workflow

Create Grant

↓

Fill Basic Information

↓

Assign Organization

↓

Assign Country

↓

Assign Category

↓

Generate AI Content

↓

Generate SEO

↓

Preview

↓

Publish

Publishing should always include validation.

---

# 34. Grant Editing Rules

Editable

Description

Funding

Eligibility

Documents

Category

SEO

AI Content

Not Editable

Created Date

Crawler History

Audit Logs

Version Number

Whenever important fields change

Create Version

Update History

Regenerate SEO

Re-index Search

---

# 35. Soft Delete Policy

Never permanently delete grants.

Delete Action

↓

Archive

↓

Soft Delete

↓

Recoverable

Future

Permanent deletion by Super Admin only.

---

# 36. Bulk Operations

Administrators should perform bulk actions.

Supported

Publish

Archive

Delete

Regenerate AI

Regenerate SEO

Assign Category

Assign Country

Assign Tags

Export CSV

Export Excel

Bulk actions must display confirmation dialogs.

---

# 37. Import Workflow

Supported Formats

CSV

Excel

JSON

Import Steps

Upload

↓

Validate

↓

Preview

↓

Resolve Errors

↓

Import

↓

Generate AI

↓

Publish

Import must never overwrite existing records without confirmation.

---

# 38. Export Workflow

Supported Formats

CSV

Excel

JSON

Future

API

Filters should apply before export.

---

# 39. AI Maintenance Center

Purpose

Allow administrators to maintain AI-generated content.

Widgets

Missing Summaries

Missing FAQs

Missing Answer Capsules

Low Confidence Records

Outdated AI Content

Token Usage

Buttons

Generate Summary

Generate FAQ

Generate Answer Capsules

Regenerate All

Estimate Tokens

This allows AI maintenance without editing grants manually.

---

# 40. SEO Maintenance Center

Purpose

Monitor SEO health.

Checks

Missing Titles

Missing Descriptions

Missing Schema

Broken Canonicals

Missing OpenGraph

Missing FAQ Schema

Buttons

Generate Metadata

Generate Schema

Validate All

Export SEO Report

---

# 41. Search Index Workflow

Whenever

Grant Published

Grant Updated

Grant Archived

↓

Update Search Index

↓

Update Related Grants

↓

Update Statistics

↓

Clear Cache

This process should be automatic.

---

# 42. Version History

Every meaningful update creates a new version.

Store

Previous Values

New Values

Changed By

Reason

Timestamp

Administrators should compare versions side-by-side.

---

# 43. Pending Review Queue

The queue contains

Low Confidence AI

Possible Duplicates

Missing Data

Crawler Errors

Broken URLs

Administrators can

Approve

Reject

Assign

Edit

Ignore

---

# 44. Duplicate Resolution

Workflow

Duplicate Detected

↓

Similarity Score

↓

Admin Review

↓

Decision

Merge

Keep Separate

Ignore

Merged records should preserve history.

---

# 45. Crawler Recovery Workflow

If crawler fails

Retry Automatically

↓

Retry Failed

↓

Notify Admin

↓

Manual Run

↓

Resolved

The crawler should never stop because one source fails.

---

# 46. AI Failure Workflow

Gemini Failure

↓

Retry

↓

Retry

↓

Fallback Prompt

↓

Manual Review

↓

Admin Notification

Every failure should be logged.

---

# 47. Scheduled Tasks

Daily

Run Crawler

Generate Missing AI

Check Broken Links

Refresh Statistics

Weekly

Validate Schema

Rebuild Search Index

Check Expired Grants

Monthly

Database Cleanup

Generate SEO Report

Backup Verification

---

# 48. Notification Rules

Notify administrators for

Crawler Failed

AI Failed

Database Error

Grant Published

Grant Archived

Duplicate Found

Low Confidence

Large Import Completed

Notifications should appear inside the dashboard.

Future

Email

Slack

Discord

---

# 49. Permission Matrix

Super Admin

Everything

Admin

Content + AI + Crawler

Editor

Content Only

Viewer

Read Only

Permissions should be role-driven.

---

# 50. Operational Runbook

The dashboard should include operational actions.

Run Crawler

Pause Crawler

Resume

Retry Failed Jobs

Regenerate AI

Rebuild Search

Validate SEO

Clear Cache

Backup Database (Future)

This allows administrators to maintain the platform without technical knowledge.

---

# 51. Business Rules

A grant cannot exist without:

Organization

Country

Category

Title

Official Source

Slug

Published grants must have:

SEO Metadata

AI Summary

Answer Capsules

Structured Data

Public URL

Validation must occur before publication.

---

# 52. Acceptance Criteria

✓ Workflow-driven operations

✓ No destructive edits

✓ Full version history

✓ AI maintenance tools

✓ SEO maintenance tools

✓ Bulk operations

✓ Import/export support

✓ Review queues

✓ Automated scheduled jobs

✓ Enterprise-grade content management

---

End of Part 5B

---

# Part 6A – SEO, AI Readability & Knowledge Graph

Grant Ninja should not only rank well in traditional search engines but also
be easily understood by modern AI systems.

This includes:

• Google AI Overview

• ChatGPT

• Claude

• Gemini

• Perplexity

• Bing AI

Every public page should contribute to the website's knowledge graph.

---

# 53. SEO Philosophy

SEO is not an afterthought.

SEO is a core feature of the platform.

Every page should be:

Human Readable

Machine Readable

AI Readable

Search Engine Friendly

Schema Rich

Internally Connected

The platform should naturally become an authority on research grants.

---

# 54. AI Readability Principles

Every page should answer user questions directly.

Avoid long marketing paragraphs.

Prefer:

Clear Headings

Bullet Lists

Tables

FAQs

Answer Capsules

Definitions

Examples

Every page should provide semantic meaning.

---

# 55. Content Hierarchy

Each page should follow a logical structure.

H1

↓

Summary

↓

Important Facts

↓

Details

↓

FAQ

↓

Related Content

↓

CTA

Never place important information only inside paragraphs.

Use structured sections.

---

# 56. Metadata Requirements

Every page must generate

Title

Meta Description

Canonical URL

Robots Meta

Keywords

OpenGraph

Twitter Cards

Structured Data

No page should have duplicate metadata.

---

# 57. Open Graph

Every page should include

og:title

og:description

og:image

og:url

og:type

og:site_name

For Grant Pages

Use

type="article"

For Marketing Pages

Use

type="website"

---

# 58. Twitter Cards

Generate

summary_large_image

Title

Description

Image

Canonical URL

---

# 59. Canonical URLs

Every page must define

Canonical URL

Avoid duplicate indexing.

Examples

Correct

/grants/ai-commercialisation-grant

Avoid

/grants?id=123

---

# 60. JSON-LD Strategy

Every page should automatically generate JSON-LD.

Schema should be server-side rendered.

Never inject incomplete schema.

---

# 61. Organization Schema

The website should publish an Organization schema.

Contains

Organization Name

Logo

Website

Contact Information

Address

Social Profiles

SameAs Links

Description

Founding Information (Future)

---

# 62. SameAs Strategy

Use authoritative profiles only.

Recommended

LinkedIn

Trustpilot

G2

Clutch

Crunchbase

YouTube

Future

Wikipedia

GitHub

The list should be editable in Admin Settings.

---

# 63. WebSite Schema

Generate

WebSite

SearchAction

PotentialAction

Publisher

Organization

Every page references the root website schema.

---

# 64. SearchAction Schema

The website search should expose

SearchAction

Target

/search?q={search_term}

Allows Google to understand website search.

---

# 65. Breadcrumb Schema

Every page should generate

BreadcrumbList

Examples

Home

↓

Countries

↓

United States

↓

California

↓

Grant

Breadcrumbs must match visible navigation.

---

# 66. CollectionPage Schema

Used for

Countries

Categories

Grant Listings

Agency Listings

Contains

Name

Description

Number of Items

Pagination

---

# 67. FAQ Schema

Every important page should contain

FAQ Schema

Examples

Homepage

Grant Detail

Country

Category

Services

About

Questions should match visible FAQs.

---

# 68. Grant Schema

Every grant page should publish structured data.

Contains

Title

Description

Organization

Funding

Deadline

Country

State

Category

Official URL

Date Published

Date Modified

Grant Status

Future

Eligibility

Documents

Funding Amount

---

# 69. Article Schema

Marketing pages may additionally expose

Article

or

WebPage

depending on content type.

---

# 70. Internal Linking Strategy

Every page should link to

Related Grants

Related Categories

Related Countries

Related Agencies

Services

About

Contact

This strengthens the knowledge graph.

---

# 71. AI Answer Capsules

Every grant page contains

Short direct answers.

Examples

What is this grant?

Who is eligible?

How much funding?

Deadline?

How to apply?

These are optimized for AI systems.

---

# 72. AI Generated Summaries

Length

150–300 words

Requirements

Easy to read

Human friendly

Fact based

No hallucinations

Generated with Gemini.

---

# 73. Heading Strategy

Every page should use

One H1

Multiple H2

Supporting H3

Avoid skipping heading levels.

---

# 74. Images

Every image should include

Alt Text

Title

Caption (optional)

Width

Height

Lazy Loading

---

# 75. Sitemap

Generate automatically.

Include

Marketing Pages

Countries

States

Categories

Organizations

Grants

Exclude

Admin

Search Results

Draft Pages

Crawler Pages

Update after new grants are published.

---

# 76. robots.txt

Allow

Public Pages

Disallow

/admin

/search?\*

Crawler Endpoints

Internal APIs

Reference Sitemap

---

# 77. llms.txt

Publish a machine-readable llms.txt file.

Purpose

Help AI systems understand:

Website Purpose

Primary Topics

Important URLs

Preferred Content

Contact Information

Update automatically when major content changes.

---

# 78. Structured Internal Knowledge Graph

Every grant should reference

Country

↓

Organization

↓

Category

↓

Tags

↓

Related Grants

↓

Services

↓

FAQs

↓

Schema

This creates strong semantic relationships.

---

# 79. Rich Snippet Optimization

Optimize pages for

FAQ Rich Results

Breadcrumb Rich Results

Organization Rich Results

Search Box

Knowledge Panels (future)

---

# 80. Performance & SEO

Target

Lighthouse SEO

100

Accessibility

95+

Performance

90+

Best Practices

100

---

# 81. Acceptance Criteria

✓ Every page has metadata

✓ Every page has JSON-LD

✓ SameAs configured

✓ FAQ schema implemented

✓ Breadcrumb schema implemented

✓ SearchAction schema implemented

✓ Organization schema implemented

✓ Grant schema generated

✓ llms.txt published

✓ sitemap.xml generated

✓ robots.txt configured

✓ AI answer capsules included

✓ Internal linking strategy implemented

✓ Knowledge graph architecture complete

---

End of Part 6A

---

# Part 6B – Large Language Model Optimization (LLMO)

This section defines how Grant Ninja should be optimized for Large Language Models
(LLMs) such as:

• Google Gemini

• ChatGPT

• Claude

• Perplexity

• Bing AI

The objective is not only to rank well in search engines but also to become
a trusted source that AI systems can understand, summarize and reference.

Grant Ninja should be designed as an AI-first knowledge platform.

---

# 82. LLM Optimization Philosophy

Traditional SEO focuses on ranking pages.

LLM Optimization focuses on making content understandable.

Every page should answer questions directly.

Every entity should have relationships.

Every section should be self-contained.

The website should become a machine-readable knowledge base.

---

# 83. Entity First Architecture

Every page represents an entity.

Examples

Grant

Organization

Country

State

Category

Service

FAQ

Each entity should reference related entities.

Example

Grant

↓

Organization

↓

Country

↓

Category

↓

Tags

↓

Related Grants

↓

Funding Services

↓

FAQs

This creates a semantic knowledge graph.

---

# 84. AI Readable Writing Style

Generated content should follow these rules.

Use short paragraphs.

Avoid unnecessary marketing language.

Prefer facts.

Explain technical terms.

Use bullet lists.

Use tables where appropriate.

Avoid ambiguous wording.

Always define acronyms.

Example

Instead of

"Our innovative funding ecosystem empowers organizations."

Use

"Grant Ninja helps businesses obtain upfront funding against approved government grants."

---

# 85. Content Chunking

Each page should be divided into logical sections.

Each section should answer one topic.

Example

Overview

↓

Funding

↓

Eligibility

↓

Application Process

↓

Documents

↓

Deadlines

↓

FAQs

↓

Related Grants

↓

Services

Each section should be understandable independently.

---

# 86. AI Answer Capsules

Every Grant Page should contain concise answers.

Examples

What is this grant?

Who can apply?

How much funding is available?

When is the application deadline?

How do I apply?

Can startups apply?

What industries are supported?

Each answer should be:

40–120 words

Fact-based

Easy to quote

---

# 87. AI Summary Block

Every grant page should begin with an AI-generated summary.

Length

150–300 words

Requirements

Human readable

Fact based

No marketing exaggeration

Updated automatically whenever grant data changes.

---

# 88. Semantic HTML

Use semantic HTML elements.

Examples

<header>

<nav>

<main>

<section>

<article>

<aside>

<footer>

Avoid excessive nested divs.

Semantic HTML improves AI understanding.

---

# 89. Heading Structure

Each page should contain

One H1

Logical H2 sections

Supporting H3 headings

Never skip heading levels.

Every heading should clearly describe the following content.

---

# 90. Tables

Where structured information exists, prefer tables.

Examples

Funding Amount

Deadlines

Eligibility

Grant Type

Required Documents

AI systems interpret tables efficiently.

---

# 91. Definitions

Every technical term should include a brief definition.

Examples

R&D Tax Credit

Competitive Grant

Matching Funds

Non-Dilutive Funding

Federal Agency

This improves AI comprehension.

---

# 92. FAQ Architecture

Every important page should contain 5–10 FAQs.

Rules

Questions should be natural.

Answers should be concise.

Avoid duplicate FAQs.

Each FAQ should have Schema.org markup.

---

# 93. Internal Entity Linking

Every page should link to related entities.

Grant →

Organization

Grant →

Category

Grant →

Country

Grant →

Funding Service

Grant →

Related Grants

This creates contextual relationships.

---

# 94. Knowledge Graph Relationships

Relationships should be explicit.

Example

Grant

belongs_to

Organization

Organization

located_in

Country

Country

contains

States

Category

contains

Grants

Services

help_with

Funding

These relationships should also be reflected in JSON-LD where applicable.

---

# 95. Citation-Friendly Content

AI models often cite concise factual content.

Every page should contain

Key Facts

Important Dates

Funding Summary

Eligibility Summary

Application Steps

These should be placed near the top of the page.

---

# 96. Source Attribution

Every grant should reference its official source.

Display

Official Website

Last Verified Date

Source Organization

Original URL

This improves trustworthiness.

---

# 97. AI Confidence Display (Optional)

Future Feature

Each AI-generated section may display

Confidence Score

Last Generated Date

Model Used

This is not required for MVP but should be supported architecturally.

---

# 98. Freshness Signals

Every grant page should display

Published Date

Last Updated Date

Last Verified Date

Next Scheduled Review

AI systems value recent information.

---

# 99. LLM Metadata

Future-ready support for AI crawlers.

Include

llms.txt

robots.txt

sitemap.xml

Canonical URLs

Schema.org

OpenGraph

No proprietary AI-specific markup should be invented.

Follow emerging web standards.

---

# 100. Content Freshness Workflow

Crawler detects change

↓

Hash changes

↓

AI regenerates summary

↓

SEO metadata updated

↓

Schema updated

↓

Page republished

↓

Search engines re-index

This keeps content synchronized.

---

# 101. AI-Friendly URL Strategy

URLs should remain

Short

Readable

Permanent

Examples

/grants/clean-energy-innovation-fund

/categories/artificial-intelligence

/countries/united-states

Avoid IDs and query parameters in public URLs.

---

# 102. Avoid AI Anti-Patterns

Do not

Keyword stuff

Hide content

Generate duplicate pages

Create thin content

Repeat identical AI summaries

Use misleading headings

Every page must provide unique value.

---

# 103. Content Quality Standards

Every AI-generated section should be reviewed against these criteria.

Accurate

Relevant

Concise

Readable

Unique

Well Structured

Fact Based

Useful

Reject content that does not meet these standards.

---

# 104. AI-Friendly Media

Images should include

Descriptive file names

Alt text

Captions where appropriate

Avoid text embedded inside images.

---

# 105. Future LLM Enhancements

Architecture should support

Vector Embeddings

Semantic Search

Hybrid Search

AI Chat Assistant

Retrieval-Augmented Generation (RAG)

Entity Embeddings

Knowledge Graph APIs

These are not part of the MVP but should be considered during architecture design.

---

# 106. Acceptance Criteria

✓ Pages are structured for AI understanding

✓ Entity relationships are explicit

✓ Answer capsules implemented

✓ AI summaries generated

✓ Semantic HTML used

✓ FAQ content optimized

✓ Source attribution visible

✓ Freshness indicators displayed

✓ Content chunking implemented

✓ LLM optimization principles followed

---

End of Part 6B

---

# Part 7A – Frontend & Application Architecture

This section defines the software architecture for the Next.js application.

The objective is to build a scalable, maintainable enterprise application
that can support future countries, millions of grants, AI integrations,
and additional products.

The architecture should prioritize:

• Maintainability

• Scalability

• Reusability

• Performance

• Type Safety

• Developer Experience

---

# 107. Frontend Technology Stack

Framework

Next.js 15

Rendering

App Router

React Server Components

Client Components only where necessary

Language

TypeScript

Styling

Tailwind CSS

UI Library

shadcn/ui

Icons

Lucide React

Animations

Framer Motion

Validation

Zod

Forms

React Hook Form

Tables

TanStack Table

Charts

Recharts

Notifications

Sonner

State

React Query (TanStack Query)

URL State

nuqs

Date Library

date-fns

Markdown

react-markdown

Syntax Highlighting

shiki

---

# 108. Architecture Principles

The application must follow

Feature Driven Development

Component Reuse

Server First Rendering

Composition over Inheritance

Single Responsibility

SOLID Principles

DRY

KISS

No business logic inside UI components.

---

# 109. Folder Structure

app/

components/

features/

hooks/

lib/

providers/

services/

types/

constants/

config/

utils/

styles/

public/

Each folder has a dedicated responsibility.

---

# 110. App Folder

Responsible only for routing.

Example

app/

(page routes only)

home/

about/

services/

contact/

countries/

categories/

grants/

admin/

No business logic should exist here.

---

# 111. Feature Architecture

Business logic lives inside

features/

Example

features/

home/

grants/

countries/

organizations/

categories/

search/

services/

admin/

seo/

crawler/

Each feature owns

Components

Hooks

Types

Services

Validation

Actions

---

# 112. Components

Shared UI lives inside

components/

Examples

Button

Input

Dialog

Card

Table

Badge

Search

Pagination

Container

Navbar

Footer

CTA

Skeleton

Loader

Modal

Toast

No feature-specific business logic.

---

# 113. Shared Libraries

lib/

Contains

Supabase Client

Utility Functions

Server Helpers

Authentication

Markdown

Formatting

Date Helpers

SEO Helpers

Never import UI into lib.

---

# 114. Types

All interfaces belong here.

Examples

Grant

Country

Organization

Category

Search

AI Summary

Crawler

Schema

Never define duplicated interfaces.

---

# 115. Config

Contains

Routes

Navigation

SEO Defaults

Environment Validation

Feature Flags

Theme

Social Links

SameAs URLs

---

# 116. Services

Contains

API wrappers

Database helpers

Search services

AI services

Media services

No UI code.

---

# 117. Providers

Application Providers

Theme

React Query

Authentication

Toast

Future

Analytics

---

# 118. Route Groups

Use route groups for organization.

Example

(public)

(admin)

(marketing)

(auth)

(api)

Keep routing clean.

---

# 119. Layouts

Shared Layouts

Marketing Layout

Dashboard Layout

Auth Layout

Error Layout

Loading Layout

Every layout should be reusable.

---

# 120. Rendering Strategy

Use Server Components by default.

Use Client Components only for

Forms

Dialogs

Interactive Search

Dropdowns

Animations

Charts

Avoid unnecessary hydration.

---

# 121. Data Fetching

Preferred

Server Components

React Query for client-side updates.

Caching

Next.js Cache

Revalidation

ISR where appropriate

Never fetch directly inside random components.

---

# 122. Server Actions

Use Server Actions for

Contact Form

Admin CRUD

Settings

Publishing

Uploads

Future Authentication

Prefer Server Actions over unnecessary API routes.

---

# 123. API Routes

Only create API routes when required.

Examples

Webhook

Crawler Callback

Health Check

External Integrations

Avoid API routes for internal actions.

---

# 124. Authentication

Supabase Auth

Middleware protects

/admin

Roles

Super Admin

Admin

Editor

Future

Viewer

---

# 125. Error Handling

Every feature should provide

Loading State

Empty State

Error State

Retry Button

Logging

Never leave blank screens.

---

# 126. Search Architecture

Global Search Component

↓

Search Service

↓

Supabase

↓

Results

Supports

Autocomplete

Filters

Sorting

Pagination

Future Semantic Search

---

# 127. Form Architecture

React Hook Form

-

Zod

Every form should include

Validation

Error Messages

Loading

Success

Reset

---

# 128. State Management

Server Data

React Query

UI State

React Hooks

URL State

nuqs

Avoid global state unless necessary.

---

# 129. Environment Variables

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE

GEMINI_API_KEY

APP_URL

SITE_NAME

Never expose secret keys to the browser.

---

# 130. Logging

Frontend logs

Errors

Warnings

Unexpected Exceptions

Future

Sentry

PostHog

---

# 131. Security

Content Security Policy

Secure Headers

Input Validation

Output Encoding

Rate Limiting

CSRF Protection

XSS Protection

Authentication Middleware

---

# 132. Performance

Lazy Loading

Image Optimization

Code Splitting

Dynamic Imports

Server Components

Streaming

Prefetching

No unnecessary JavaScript.

---

# 133. Accessibility

Keyboard Navigation

Screen Reader Support

Focus Management

ARIA Labels

Semantic HTML

Color Contrast

Skip Links

---

# 134. Testing Strategy

Future

Unit Tests

Component Tests

Playwright E2E

Accessibility Tests

Performance Tests

---

# 135. Coding Standards

Strict TypeScript

No any

No duplicated logic

Reusable components

Small functions

Meaningful names

Maximum readability

---

# 136. Acceptance Criteria

✓ Feature-based architecture

✓ Fully typed

✓ Server-first rendering

✓ Minimal client JavaScript

✓ Reusable components

✓ Secure

✓ Responsive

✓ Maintainable

✓ Production-ready

---

End of Part 7A

---

# Part 7B – Python AI Platform Architecture

This section defines the backend AI platform responsible for discovering,
extracting, validating, enriching and publishing structured grant data.

The Python service should be designed as an independent application.

It should be reusable across multiple future projects.

The platform should not contain any Grant Ninja specific business logic
inside the core framework.

Grant Ninja should simply become one implementation of the platform.

---

# 137. Python Platform Goals

The platform should be capable of:

• Crawling websites

• Reading PDFs

• Reading RSS feeds

• Parsing HTML

• AI Extraction

• Duplicate Detection

• Data Validation

• Publishing Records

• Scheduling Jobs

• Monitoring Health

• Logging

• Retry Handling

• Multi-country Support

---

# 138. Architecture Philosophy

Every responsibility should be isolated.

No module should perform multiple jobs.

The architecture follows

Input

↓

Processing

↓

Validation

↓

Publishing

↓

Monitoring

Each stage should be replaceable.

---

# 139. Folder Structure

python/

│

├── app/

├── config/

├── crawler/

├── adapters/

├── extractors/

├── processors/

├── ai/

├── publishers/

├── repositories/

├── scheduler/

├── monitoring/

├── logging/

├── prompts/

├── validators/

├── models/

├── services/

├── database/

├── utils/

├── tests/

└── main.py

---

# 140. App Layer

Purpose

Application entry point.

Responsible for

Bootstrapping

Dependency Injection

Configuration

Startup

Shutdown

No business logic.

---

# 141. Configuration

All configuration should come from

.env

Never hardcode

API Keys

URLs

Timeouts

Crawler Settings

Retry Limits

AI Models

Environment Variables

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

GEMINI_API_KEY

LOG_LEVEL

MAX_CONCURRENT_JOBS

REQUEST_DELAY

PLAYWRIGHT_TIMEOUT

HEADLESS

DEFAULT_COUNTRY

---

# 142. Adapter Layer

Adapters isolate every source.

Examples

GrantsGovAdapter

NSFAdapter

NIHAdapter

DOEAdapter

IrelandAdapter

RSSAdapter

GenericHTMLAdapter

Each adapter returns a common structure.

---

# 143. Discovery Engine

Responsible for discovering pages.

Supports

Sitemaps

Pagination

Static URLs

RSS

Manual Lists

Future APIs

Output

URL Queue

---

# 144. Fetch Engine

Preferred

Crawl4AI

Fallback

Playwright

Final Fallback

Requests

Responsibilities

Download Content

Retry

Rate Limit

Cache

Store Hash

Capture Metadata

---

# 145. Crawl4AI Integration

Crawl4AI becomes the default crawling engine.

Benefits

JavaScript rendering

Content cleaning

Markdown generation

Link extraction

Content chunking

Caching

Async crawling

Use Crawl4AI whenever possible.

---

# 146. Extractor Layer

Responsible only for extraction.

Extract

Grant Title

Funding

Eligibility

Deadlines

Documents

Application Links

Organization

Country

State

Raw Content

Never perform AI tasks here.

---

# 147. Normalization Layer

Converts inconsistent data into a common format.

Normalize

Dates

Currencies

Phone Numbers

URLs

Whitespace

Country Names

Categories

Everything should become predictable.

---

# 148. AI Layer

Responsible for

Prompt Creation

Gemini Calls

JSON Validation

Retry

Token Logging

Prompt Versioning

Never communicate directly with the database.

---

# 149. Prompt Manager

Store prompts separately.

Examples

grant_summary.md

faq.md

answer_capsules.md

seo.md

classification.md

duplicate_detection.md

Every prompt has

Version

Description

Expected Output

---

# 150. JSON Validation

Every Gemini response must validate against

Pydantic Models

Reject

Missing Fields

Invalid JSON

Incorrect Dates

Unknown Categories

Unexpected Types

Only validated data proceeds.

---

# 151. Processing Layer

Business rules.

Examples

Grant Classification

Funding Classification

Country Assignment

Category Assignment

Tag Assignment

Duplicate Detection

Relationship Building

---

# 152. Duplicate Detection

Methods

SHA256 Hash

↓

RapidFuzz

↓

Gemini Semantic Check

↓

Decision

Duplicate

Merge

New Grant

Manual Review

---

# 153. Repository Layer

The application never talks directly to Supabase.

Instead

Repository

↓

Supabase

Repositories

GrantRepository

CountryRepository

CategoryRepository

OrganizationRepository

CrawlerRepository

This allows replacing Supabase later.

---

# 154. Publisher Layer

Responsibilities

Insert

Update

Archive

Version

SEO

Schema

Search Index

Publishing should be transactional.

---

# 155. Scheduler

Runs

Daily Jobs

Weekly Jobs

Manual Jobs

Supports

Single Source

Single Country

Everything

Future

Distributed Workers

---

# 156. Monitoring

Track

Execution Time

Failures

Retries

Pages

Sources

AI Calls

Token Usage

Memory

CPU

Average Duration

Store metrics for dashboard display.

---

# 157. Logging

Use

Loguru

Log

INFO

WARNING

ERROR

DEBUG

Store

Console

File

Future

Database

Logs should be searchable.

---

# 158. Error Recovery

Every stage handles failures independently.

If AI fails

Retry

↓

Fallback Prompt

↓

Manual Review

If Crawl fails

Retry

↓

Playwright

↓

Skip

↓

Continue Queue

Never stop the pipeline.

---

# 159. Cost Optimization

Reduce AI costs by

Hash Comparison

Caching

Skip Unchanged Pages

Batch Processing

Markdown instead of HTML

Reuse AI Output

Use Gemini Flash

Only regenerate AI when required.

---

# 160. Deployment

Hostinger VPS

Ubuntu

Python 3.12+

Virtual Environment

Cron

Systemd Service (optional)

Directory

/opt/grant-ninja-ai/

Logs

/var/log/grant-ninja/

Configuration

.env

---

# 161. Security

Secrets stored in

.env

Never commit

API Keys

Database Credentials

Use least-privilege access.

Validate every external input.

---

# 162. Testing Strategy

Unit Tests

Adapter Tests

Crawler Tests

AI Tests

Repository Tests

Integration Tests

Mock Gemini responses during testing.

---

# 163. Documentation

Every module should include

Purpose

Inputs

Outputs

Dependencies

Error Handling

Example Usage

---

# 164. Acceptance Criteria

✓ Crawl4AI integrated

✓ Modular architecture

✓ Reusable adapters

✓ Pydantic validation

✓ Repository pattern

✓ AI isolated

✓ Logging implemented

✓ Monitoring implemented

✓ Cost optimized

✓ Production ready

---

End of Part 7B

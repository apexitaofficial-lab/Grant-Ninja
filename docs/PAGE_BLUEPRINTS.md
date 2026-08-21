# PAGE_BLUEPRINTS.md

Version: 1.0

Project:
Grant Ninja

Purpose

This document defines the layout and content hierarchy for every page in the
Grant Ninja application.

These are blueprints, not pixel-perfect wireframes.

The objective is to provide Claude Code with a clear understanding of page
structure, user flow, component hierarchy and content priority.

All pages should follow the UI_UX_DESIGN_SYSTEM.md.

---

# Global Page Structure

Every public page should follow

Navbar

↓

Breadcrumb (except Home)

↓

Page Hero / Header

↓

Main Content

↓

Related Content

↓

Call To Action

↓

Footer

Spacing should remain consistent across the website.

---

# 1. Home Page

---

## Sticky Navbar

Logo

Navigation

Search

Primary CTA

---

Hero Section

---

H1

Supporting Paragraph

Primary CTA

Secondary CTA

Large Global Search

---

Statistics

---

Total Grants

Countries

Government Agencies

Recently Updated

---

Browse by Country

---

Country Cards

---

Browse by Category

---

Category Cards

---

Featured Grants

---

Grant Cards

---

Latest Grants

---

Grant Cards

---

Recently Updated Grants

---

Grant Cards

---

Closing Soon

---

Grant Cards

---

Why Grant Ninja

---

Benefits

AI Powered

Weekly Updates

Official Sources

Expert Funding Support

---

Grant Ninja Services

---

Funding Advances

Grant Advisory

Grant Discovery

R&D Finance

---

Testimonials (Future)

---

FAQ

---

CTA Section

---

Footer

---

# 2. Grant Listing Page

Navbar

↓

Breadcrumb

↓

Page Header

↓

Search Bar

↓

Advanced Filters

↓

Sort Dropdown

↓

Grant Results

↓

Pagination

↓

Related Categories

↓

Footer

Grant Card should display

Grant Name

Funding

Country

Agency

Deadline

Status

Category

Short Summary

View Details Button

---

# 3. Grant Detail Page

Navbar

↓

Breadcrumb

↓

Grant Header

Grant Title

Status

Category

Funding

Deadline

Agency

Country

↓

AI Generated Summary

↓

Key Facts

↓

Funding Details

↓

Eligibility

↓

Application Process

↓

Required Documents

↓

Official Website

↓

Answer Capsules

↓

Frequently Asked Questions

↓

Related Grants

↓

Grant Ninja Services CTA

↓

Footer

---

# 4. Country Page

Navbar

↓

Breadcrumb

↓

Country Hero

↓

Overview

↓

Statistics

↓

State List (if applicable)

↓

Featured Grants

↓

Latest Grants

↓

Related Categories

↓

FAQ

↓

Footer

---

# 5. Category Page

Navbar

↓

Breadcrumb

↓

Category Hero

↓

Category Description

↓

Statistics

↓

Grant Listing

↓

Pagination

↓

Related Categories

↓

FAQ

↓

Footer

---

# 6. Search Results Page

Navbar

↓

Search Input

↓

Active Filters

↓

Results Count

↓

Grant Results

↓

Pagination

↓

Suggested Searches

↓

Footer

---

# 7. About Page

Navbar

↓

Hero

↓

Mission

↓

Vision

↓

Our Platform

↓

Why Grant Ninja

↓

Funding Services

↓

Our Process

↓

FAQ

↓

CTA

↓

Footer

---

# 8. Services Page

Hero

↓

Funding Advance Service

↓

Grant Discovery Platform

↓

AI Grant Monitoring

↓

How It Works

↓

Benefits

↓

Industries Served

↓

Frequently Asked Questions

↓

Contact CTA

↓

Footer

Purpose

Promote Grant Ninja as

Funding Partner

Financial Service

Innovation Funding Specialist

Not only a grants database.

---

# 9. Contact Page

Hero

↓

Contact Form

↓

Company Information

↓

Business Hours

↓

Map (Optional)

↓

FAQ

↓

Footer

---

# 10. AI Search Page (Future)

Large Search

↓

Suggested Questions

↓

AI Generated Answer

↓

Supporting Grants

↓

Related Questions

↓

Footer

---

# 11. Admin Login

Centered Card

Logo

↓

Email

↓

Password

↓

Login

↓

Forgot Password

Minimal layout.

---

# 12. Admin Dashboard

Sidebar

↓

Top Navigation

↓

Statistics

↓

Crawler Status

↓

AI Status

↓

Recent Grants

↓

Recent Activity

↓

Pending Reviews

↓

Quick Actions

↓

Charts

↓

Footer

---

# 13. Grant Management

Sidebar

↓

Toolbar

↓

Search

↓

Filters

↓

Bulk Actions

↓

Grant Table

↓

Pagination

↓

Drawer / Modal Editor

---

# 14. Grant Editor

Sidebar

↓

Header

↓

Tabs

Overview

Funding

Eligibility

Documents

AI Content

SEO

History

↓

Save

↓

Preview

↓

Publish

---

# 15. AI Operations Center

Statistics

↓

Token Usage

↓

Prompt Versions

↓

Recent AI Jobs

↓

Failed Jobs

↓

Low Confidence Items

↓

Bulk Regeneration

↓

Logs

---

# 16. Crawler Center

Statistics

↓

Configured Sources

↓

Recent Runs

↓

Queue Status

↓

Failed Jobs

↓

Manual Run Button

↓

Logs

---

# 17. SEO Center

Statistics

↓

Missing Metadata

↓

Missing Schema

↓

Broken Links

↓

Duplicate Titles

↓

Generate SEO

↓

Schema Validation

↓

Reports

---

# 18. Organization Management

Organization Table

↓

Search

↓

Filters

↓

CRUD

↓

Grant Count

↓

SEO

---

# 19. Country Management

Country Table

↓

Statistics

↓

SEO

↓

Grant Count

↓

Edit

---

# 20. Category Management

Category Cards

↓

CRUD

↓

SEO

↓

Grant Count

---

# 21. User Management

Users

↓

Roles

↓

Permissions

↓

Activity

↓

Invite User

---

# 22. Audit Logs

Search

↓

Filters

↓

Timeline

↓

Action Details

↓

Export

---

# 23. Settings

General

↓

Branding

↓

Social Links

↓

SameAs

↓

Gemini

↓

Crawler

↓

SEO

↓

System

↓

Save

---

# Common Components

The following components should be reusable across the application.

Navbar

Footer

Container

Hero

Search

Breadcrumb

Grant Card

Country Card

Category Card

Statistics Card

Feature Card

FAQ

Answer Capsule

CTA Section

Pagination

Filters

Sidebar

Dashboard Widget

Table

Modal

Drawer

Toast

Skeleton

Loading Spinner

Empty State

Error State

---

# Responsive Rules

Desktop

Full Layout

Tablet

Two-column where appropriate

Mobile

Single Column

Drawer Navigation

Stacked Cards

Responsive Tables

Touch Friendly Buttons

---

# Animation Guidelines

Page Fade

Section Reveal

Card Hover

Button Hover

Drawer Slide

Dialog Scale

Loading Skeleton

Animations should be subtle and never distract from the content.

---

# Accessibility Rules

Keyboard Navigation

Visible Focus

ARIA Labels

Semantic HTML

Screen Reader Friendly

Accessible Forms

High Color Contrast

---

# User Experience Principles

The user should always know

Where they are

What they can do

What happened

What happens next

Avoid confusing navigation.

Minimize clicks.

Prioritize search and discovery.

---

# End of PAGE_BLUEPRINTS.md

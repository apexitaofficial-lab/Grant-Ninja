# UI_UX_DESIGN_SYSTEM.md

Version: 1.0

Project:
Grant Ninja

Purpose

This document defines the complete visual design system and user experience
guidelines for Grant Ninja.

The goal is to create a modern, premium SaaS website that feels trustworthy,
professional and extremely easy to use.

The UI should take inspiration from:

• CreditIndex.org (overall information architecture)
• Stripe (spacing and cleanliness)
• Vercel (minimalism)
• Linear (dashboard experience)
• shadcn/ui (component library)

Do not copy these websites.

Use them only as inspiration for layout quality and user experience.

---

# 1. Design Philosophy

Grant Ninja should feel

Professional

Modern

Minimal

Fast

Trustworthy

AI-powered

The interface should avoid clutter.

Whitespace is encouraged.

Information hierarchy is more important than decoration.

---

# 2. Overall Theme

The website should communicate

"The world's most extensive research grants database."

while also promoting Grant Ninja as

A funding intermediary

An R&D grant specialist

An AI-powered research platform

Every page should reinforce trust.

---

# 3. Design Language

Use

Large whitespace

Rounded corners

Soft shadows

Clean typography

Subtle animations

Consistent spacing

Avoid

Heavy gradients

Glassmorphism

Overly colorful interfaces

Excessive animations

Dark backgrounds

---

# 4. Color Palette

Primary

Blue

Used for

Buttons

Links

Highlights

Active States

Secondary

Emerald Green (subtle accent)

Used for

Funding highlights

Growth indicators

Brand accents

Rationale

Grant Ninja is about finance, funding and growth.
Green carries those associations; purple does not.

This supersedes the earlier "Purple" note and resolves the
conflict with MASTER_PROJECT_SPEC.md §43, which already
specified Emerald.

Success

Green

Warning

Amber

Danger

Red

Background

White

Secondary Background

Very Light Gray

Cards

White

Borders

Light Gray

Text

Dark Gray

Muted Text

Medium Gray

Never use bright saturated colors.

---

# 5. Typography

Font

Inter

Fallback

System UI

Heading

Bold

Large

Readable

Body

Regular

16px

Comfortable line spacing

Small Text

Muted

Labels

Medium weight

Buttons

Semi Bold

Avoid decorative fonts.

---

# 6. Layout

Maximum Content Width

1280px

Container Padding

Consistent across every page.

Sections should have generous spacing.

Every page should breathe.

---

# 7. Responsive Breakpoints

Mobile

Tablet

Laptop

Desktop

Ultra Wide

Every page must work perfectly on all devices.

Mobile is not optional.

---

# 8. Navigation

Sticky Navbar

Contains

Logo

Search

Countries

Categories

Services

About

Contact

Admin Login

CTA Button

Navbar should shrink slightly while scrolling.

---

# 9. Hero Section

Large headline

Short supporting paragraph

Primary CTA

Secondary CTA

Large search box

Background should remain clean.

Optional subtle illustration.

---

# 10. Search Experience

The search bar is the primary feature.

Large

Centered

Fast

Autocomplete

Suggestions

Keyboard Friendly

Filters should appear below.

---

# 11. Buttons

Primary

Solid Blue

Secondary

Outline

Ghost

Minimal

Danger

Red

Loading state required.

Hover animations should be subtle.

---

# 12. Cards

Every card should contain

Soft Shadow

Rounded Corners

Hover Elevation

Consistent Padding

Never overcrowd cards.

---

# 13. Grant Card

Display

Grant Title

Funding Amount

Country

Agency

Deadline

Category

Status Badge

Short Summary

Apply Button

Save space without hiding important information.

---

# 14. Tables

Use TanStack Table.

Requirements

Sorting

Filtering

Pagination

Responsive

Sticky Header

Hover States

Row Selection

---

# 15. Forms

Every form should include

Labels

Placeholders

Validation

Error Messages

Loading States

Success Feedback

Required indicators

Forms should never feel intimidating.

---

# 16. Sidebar (Admin)

Collapsed by default on mobile.

Contains icons.

Expandable.

Current page highlighted.

Smooth transitions.

---

# 17. Dashboard Widgets

Cards showing

Total Grants

Countries

Organizations

AI Status

Crawler Status

Pending Reviews

Recent Updates

Use icons sparingly.

---

# 18. Charts

Simple

Readable

Minimal

No unnecessary decoration.

Use Recharts.

---

# 19. Animations

Use Framer Motion.

Animation duration

150–300ms

Examples

Fade

Slide

Scale

Hover

Avoid flashy animations.

---

# 20. Icons

Use Lucide React.

Use icons consistently.

Do not mix icon libraries.

---

# 21. Empty States

Every page should have a meaningful empty state.

Example

"No grants found."

Provide helpful suggestions.

---

# 22. Loading States

Use Skeleton components.

Avoid large spinners.

Loading should feel natural.

---

# 23. Error States

Friendly messages.

Retry button.

Do not expose technical errors.

---

# 24. Badges

Examples

Federal

State

Open

Closing Soon

Expired

Featured

AI Verified

Colors should be consistent.

---

# 25. Breadcrumbs

Display on all inner pages.

Example

Home

>

United States

>

California

>

Grant

---

# 26. Footer

Contains

Logo

Navigation

Countries

Categories

Services

About

Contact

Privacy

Terms

Social Links

Copyright

Newsletter (future)

---

# 27. Accessibility

Keyboard Navigation

Focus States

ARIA Labels

Semantic HTML

Readable Contrast

Screen Reader Friendly

---

# 28. SEO Layout

Every page should contain

H1

Summary

Content Sections

FAQ

Related Pages

CTA

Footer

Consistent hierarchy improves SEO and AI readability.

---

# 29. AI-Friendly Content Blocks

Each Grant Page should include

AI Summary

Key Facts

Answer Capsules

FAQs

Related Grants

Structured Information

These sections should appear above long descriptions.

---

# 30. Mobile Experience

Navigation becomes drawer.

Search remains prominent.

Cards stack vertically.

Tables become responsive.

Buttons become full width where appropriate.

Touch targets should be large.

---

# 31. Performance

Optimize

Images

Fonts

JavaScript

Animations

Use lazy loading where appropriate.

---

# 32. Visual Consistency

Every page should feel like part of the same product.

Spacing

Typography

Buttons

Cards

Colors

Icons

should remain consistent throughout.

---

# 33. Future Expansion

The design system should easily support

Multiple Countries

Multiple Languages

Dark Mode (future)

User Accounts

Saved Grants

Notifications

AI Chat

No redesign should be required.

---

# 34. Acceptance Criteria

✓ Modern SaaS appearance

✓ Inspired by CreditIndex.org structure

✓ Premium visual quality

✓ Responsive

✓ Accessible

✓ Fast

✓ Consistent

✓ AI-friendly

✓ SEO-friendly

✓ Production ready

End of UI_UX_DESIGN_SYSTEM.md

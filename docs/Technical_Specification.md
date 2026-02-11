# Event Registration App – Architecture & Delivery Specification

---

# 1. Project Overview

## 1.1 Purpose

Build a single-event web application that:

* Presents event information
* Allows guests to register
* Provides a long-lived manage link (capability link) for guests
* Provides authenticated admin control over registrations

The system must be secure, simple, and easily extendable for future events.

## 1.2 Scope

Included:

* Public event page
* Registration flow
* Capability-link-based registration management
* Admin authentication
* Admin console with overview and control
* Email delivery

Excluded:

* Payments
* Ticketing system
* Complex invitation systems
* Multi-event management (future extension)

## 1.3 Core Principles

* Guests do NOT create accounts
* Guests use capability-based manage links
* Admins use authenticated accounts
* Security and data minimization first
* Clear separation between UI and business logic
* Single event implementation (extensible later)

---

# 2. High-Level Architecture

## 2.1 System Context

* Next.js (App Router, TypeScript)
* Prisma ORM
* Supabase Postgres
* Supabase Auth (admins only)
* Resend (transactional email)
* Hosted on Vercel

## 2.2 Logical Layers

### UI Layer

* React components
* Pages and layouts
* Styling (Tailwind + component system)

### Application Layer

* Use cases (register, update, cancel, resend)
* Validation (Zod)
* Security rules enforcement

### Data Layer

* Prisma repositories
* Database access only

### Infrastructure Layer

* Authentication (Supabase Auth)
* Email service
* Hosting configuration

Strict rule: No business logic inside UI components.

## 2.3 Authentication Model

### Guests

* Use long-lived capability tokens
* No accounts
* No passwords

### Admins

* Supabase Auth
* Role verification via internal allowlist table
* Route protection on all `/admin/*`

---

# 3. Domain Model (Conceptual)

## Registration

Represents a guest’s RSVP and associated metadata.

## RegistrationToken

Represents a capability token granting edit access to a registration.

## AdminUser

Represents an authenticated administrator allowed to access admin features.

---

# 4. Security & Compliance Constraints (Global Guardrails)

These apply to the entire system.

* Capability tokens must be:

  * High entropy
  * Stored hashed
  * Never logged
  * Revocable
  * Expirable (policy-defined)

* Resend endpoint must not reveal whether an email exists.

* Rate limiting required on:

  * Registration submission
  * Token lookup
  * Resend link endpoint

* Admin endpoints must require authentication + role check.

* Data retention policy must be defined and implemented.

* Minimize personal data collection.

---

# 5. Feature Backlog (Epics → Stories)

## Epic 1 – Project Bootstrap

* Initialize Next.js (TypeScript)
* Configure Prisma + migrations
* Connect Supabase Postgres
* Integrate Supabase Auth
* Integrate Resend
* Environment configuration

## Epic 2 – Public Event Page

* Event landing page
* Responsive layout
* Theming support

## Epic 3 – Registration Flow

* Registration form UI
* Server-side validation
* Persist registration
* Generate capability token
* Send manage link email

## Epic 4 – Manage Registration (Capability Link)

* Token verification
* Edit registration
* Cancel registration
* Token rotation policy implementation

## Epic 5 – Resend Manage Link

* Email submission endpoint
* Token regeneration
* Non-leaking response behavior

## Epic 6 – Admin Authentication

* Supabase Auth integration
* Admin allowlist table
* Route protection middleware

## Epic 7 – Admin Console

* Registration list view
* Filters and search
* Aggregated statistics
* Edit/cancel actions
* CSV export

## Epic 8 – Security Hardening

* Rate limiting implementation
* Token logging protection
* Error handling policy

## Epic 9 – Data Retention

* Retention policy implementation
* Manual or scheduled purge
* Documentation of retention policy

---

# 6. Definition of Done

## 6.1 Global Definition of Done

* Security constraints respected
* Authentication enforced correctly
* No sensitive data exposure
* Architecture layering maintained

## 6.2 Feature-Level Definition of Done

* Feature implemented
* Server-side validation in place
* Error states handled
* Conforms to global constraints
* Code reviewed and merged

---

End of specification.

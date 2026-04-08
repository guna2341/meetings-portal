# Software Requirements Specification (SRS)
## Project: Meetings Portal

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to provide a detailed description of the "Meetings Portal" project. It outlines the functional and non-functional requirements, system architecture, and user interfaces to serve as a guide for developers and stakeholders.

### 1.2 Scope
The Meetings Portal is a multi-tenant web application designed to facilitate organized professional meetings. It allows users to create organizations, invite members, schedule meetings (online/offline/hybrid), manage meeting agendas, assign tasks, take notes, and communicate via a built-in chat system.

### 1.3 Definitions and Abbreviations
*   **JWT**: JSON Web Token (used for authentication).
*   **Organization**: A virtual workspace containing members and meetings.
*   **Owner**: The user who created the organization.
*   **Admin**: A user with management permissions within an organization.
*   **Member**: A standard user within an organization.
*   **SRS**: Software Requirements Specification.

---

## 2. Overall Description

### 2.1 Product Perspective
Meetings Portal is a standalone web application built with a modern tech stack (Next.js, MongoDB, TypeScript). It utilizes email services for invitations and notifications.

### 2.2 Product Functions
*   **User Management**: Registration, Login, Profile Management.
*   **Organization Management**: Create/Update/Delete organizations, multi-tenancy support.
*   **Member Management**: Role-based access control (RBAC), invitations via email.
*   **Meeting Management**: Scheduling, status tracking (Upcoming, Completed, Cancelled).
*   **Meeting Components**: Agendas, Attendee tracking, Real-time Notes, Task assignment.
*   **Communication**: Direct and group chat systems integrated with meetings.
*   **Notifications**: Email and in-app notifications.

### 2.3 User Classes and Characteristics
*   **Unauthenticated Users**: Can browse the landing page, register, or accept invitations.
*   **Authenticated Users**: Can manage their profile, participate in meetings, and chat.
*   **Organization Owners/Admins**: Can manage organization settings and members.

---

## 3. System Features

### 3.1 Authentication & Profile
*   **REQ-AUTH-1**: Users must be able to register with email, name, and password.
*   **REQ-AUTH-2**: Secure login via JWT stored in HTTP-only cookies.
*   **REQ-AUTH-3**: Password reset functionality via email tokens.
*   **REQ-AUTH-4**: Middleware-based protection for all dashboard and meeting routes.

### 3.2 Organization & Multi-tenancy
*   **REQ-ORG-1**: Users can create multiple organizations.
*   **REQ-ORG-2**: Each organization has a unique slug and isolated data.
*   **REQ-ORG-3**: Owners can invite members by email with specific roles (Admin/Member).
*   **REQ-ORG-4**: Audit logs track organizational changes (member addition/removal, role changes).

### 3.3 Meeting Management
*   **REQ-MEET-1**: Users can create meetings with title, description, date, time, and location.
*   **REQ-MEET-2**: Support for Online (link-based), Offline (physical), and Hybrid meetings.
*   **REQ-MEET-3**: Automated attendee tracking (Pending/Accepted/Declined).
*   **REQ-MEET-4**: Live agenda management during meetings.
*   **REQ-MEET-5**: Ability to take notes with author timestamps.

### 3.4 Task Tracking
*   **REQ-TASK-1**: Users can assign tasks to specific members during or after a meeting.
*   **REQ-TASK-2**: Tasks have due dates, priorities (Low, Medium, High), and status (Pending, In-Progress, Completed).
*   **REQ-TASK-3**: Centralized "My Tasks" and "Assigned Tasks" dashboards.

### 3.5 Communications
*   **REQ-CHAT-1**: Direct messaging between organization members.
*   **REQ-CHAT-2**: Group chats linked to specific meetings.
*   **REQ-CHAT-3**: Real-time message history and participant tracking.

---

## 4. Technical Stack

*   **Frontend**: Next.js (App Router), React 19, Tailwind CSS v4.
*   **Backend**: Next.js API Routes (Serverless).
*   **Database**: MongoDB with Mongoose ODM.
*   **Authentication**: Custom JWT-based auth with `bcrypt` hashing.
*   **Email**: `nodemailer` with SMTP configuration.
*   **Icons**: `lucide-react`.

---

## 5. External Interface Requirements

### 5.1 User Interfaces
*   A responsive, modern web interface.
*   Sidebar-based navigation for dashboard, meetings, tasks, and settings.
*   Dedicated "Invite" landing page for external users.

### 5.2 Database Interface
*   MongoDB connection via URI.
*   Schema definitions for Users, Organizations, Memberships, Invitations, Meetings, Conversations, Messages, and AuditLogs.

---

## 7. Data Models (Database Schema)

### 7.1 User Model
*   `name`: String (Optional)
*   `email`: String (Unique, Validated)
*   `password`: String (Hashed)
*   `currentOrgId`: ObjectId (Last active organization)

### 7.2 Organization Model
*   `name`: String (Max 100)
*   `slug`: String (Unique, kebab-case)
*   `description`: String (Max 500)
*   `createdBy`: ObjectId (User ref)

### 7.3 Meeting Model
*   `title`: String (Max 200)
*   `meetingType`: Enum (Online, Offline, Hybrid)
*   `status`: Enum (Upcoming, Completed, Cancelled)
*   `attendees`: Array of Objects (name, email, status)
*   `tasks`: Array of Objects (title, assignedTo, dueDate, status, priority)
*   `notes`: Array of Objects (author, content, timestamp)

---

## 8. API Architecture (Key Endpoints)

### 8.1 Authentication Endpoints
*   `POST /api/auth/register`: User sign-up.
*   `POST /api/auth/login`: User sign-in (sets JWT cookie).
*   `POST /api/auth/logout`: Clears session cookie.

### 8.2 Organization Endpoints
*   `POST /api/organizations`: Create new org.
*   `GET /api/organizations`: List user's organizations.
*   `POST /api/invitations`: Send email invitation to new member.

### 8.3 Meeting Endpoints
*   `POST /api/meetings`: Schedule a meeting.
*   `GET /api/meetings`: Fetch meetings for current org (filtered by status).
*   `PATCH /api/meetings/[id]`: Update agenda, status, or notes.

---

## 9. Key Workflows

### 9.1 The Invitation Workflow
1.  **Admin** triggers invite via email.
2.  **System** generates unique token and saves `Invitation` record.
3.  **User** receives email with link `/invite?token=XYZ`.
4.  **User** clicks link, creates account (if needed), and confirms.
5.  **System** creates `Membership` and updates `Invitation` status to 'accepted'.

### 9.2 The Meeting Lifecycle
1.  **Schedule**: Define agenda and invite attendees.
2.  **Execution**: Real-time note-taking and task assignment.
3.  **Completion**: Meeting marked 'completed', tasks synced to dashboards.

---

## 10. Non-functional Requirements

### 10.1 Security
*   **Authentication**: Custom JWT-based authentication with secure cookie storage.
*   **Authorization**: Middleware-based access control ensuring users only access organizations they are members of.
*   **Data Isolation**: Every database query must include the `organizationId` or `userId` context to prevent cross-tenant data leaks.
*   **Email Security**: Time-bound invitation and password-reset tokens.

### 10.2 Performance
*   **Response Time**: API response times should aim for < 200ms for standard CRUD operations.
*   **Concurrency**: Support for multiple concurrent users within the same organization using MongoDB's atomic operations.
*   **Static Assets**: Use Next.js Image optimization for logos and profiles.

### 10.3 Reliability
*   Soft-delete implementation to prevent accidental data loss.
*   Audit logs for all critical organizational changes.

---

## 11. UI/UX Guidelines

*   **Aesthetics**: Modern, premium design with a professional color palette (e.g., Indigo, Slate, Emerald).
*   **Responsiveness**: Mobile-first design ensuring the portal is usable on tablets and smartphones.
*   **Micro-interactions**: Subtle animations for state changes (hover effects, loading spinners, toast notifications).
*   **Accessibility**: Semantic HTML and ARIA labels for screen reader compatibility.

---

## 12. Future Enhancements

*   Video conferencing integration (e.g., Zoom/Jitsi API).
*   Calendar sync with Google/Outlook.
*   AI-generated meeting summaries from notes.
*   File storage for meeting attachments.

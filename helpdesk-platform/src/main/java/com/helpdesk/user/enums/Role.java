package com.helpdesk.user.enums;

/**
 * Defines the access levels and permissions for users within the system.
 */
public enum Role {
    /**
     * Standard employee. Can only view and create tickets for themselves.
     */
    EMPLOYEE,

    /**
     * Team or Department Manager. Approves/rejects tickets for their team members.
     */
    MANAGER,

    /**
     * IT/HR Support Agent. Can view, assign, update, and resolve tickets.
     */
    SUPPORT_AGENT,

    /**
     * System Administrator. Has full access to configure workflows, view all tickets, and manage users.
     */
    ADMIN
}

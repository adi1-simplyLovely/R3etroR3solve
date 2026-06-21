package com.helpdesk.ticket.enums;

import com.helpdesk.user.enums.Department;

public enum Category {
    IT_HARDWARE(Department.IT),
    IT_SOFTWARE(Department.IT),
    IT_NETWORK(Department.IT),
    IT_ACCESS(Department.IT),
    HR_PAYROLL(Department.HR),
    HR_BENEFITS(Department.HR),
    FINANCE(Department.FINANCE),
    FACILITIES(Department.FACILITIES),
    OTHER(Department.OTHER);

    private final Department associatedDepartment;

    Category(Department associatedDepartment) {
        this.associatedDepartment = associatedDepartment;
    }

    public Department getAssociatedDepartment() {
        return associatedDepartment;
    }
}

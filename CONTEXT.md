# Room Booking

This context governs room reservations, tenant companies, and the administrative lifecycle of both.

## Language

**Booking**:
A request by a user to reserve one room for a defined time range.
_Avoid_: Event, appointment

**Cancellation**:
A terminal booking transition that preserves the booking record and its operational history.
_Avoid_: Delete, removal

**Purge**:
An irreversible administrative deletion of a terminal booking or an inactive company and its booking history.
_Avoid_: Cancellation, archive

**Company**:
A tenant organization to which users and bookings are attributed.
_Avoid_: Account, customer

**Deactivation**:
A reversible company state that blocks new invitations and bookings while preserving users and booking history.
_Avoid_: Delete, disable users

**Company Purge**:
An irreversible operation that deletes a company and its bookings while retaining and detaching its user identities.
_Avoid_: Deactivation, user deletion

**Company Assignment**:
The relationship attaching a user to an active company for future booking eligibility. Reassignment does not alter historical booking attribution.
_Avoid_: Rewriting booking history, moving bookings

**Booking Creator**:
The durable person profile that originally submitted a booking. This relationship never changes, including after deactivation or anonymization.
_Avoid_: Current owner, login account

**Booking Responsibility**:
The active person expected to manage an upcoming booking. Responsibility may be transferred without changing its creator or company attribution.
_Avoid_: Creator, company ownership

**User Deactivation**:
A reversible loss of login access. Upcoming booking responsibility must be transferred, while the durable profile and history remain.
_Avoid_: Deletion, anonymization

**User Anonymization**:
An irreversible removal of login access and personal identity after deactivation. The durable profile remains as "Former user" so booking and audit history survive.
_Avoid_: Booking deletion, responsibility transfer

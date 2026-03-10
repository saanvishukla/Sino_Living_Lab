# Module: Operations

An automated workflow for modifying tenant structure by monitoring incoming emails and new form entries. Below we describe the structure of this module.

### Email Monitoring

We utilize IMAP for monitoring incoming emails, specifically, using IMAP IDLE command.

### Utils

- **db_\***: These functions are associated with database operations. They simplify adding or deleting rows from the database.

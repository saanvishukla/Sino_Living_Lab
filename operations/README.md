# Module: Operations

An automated workflow for modifying tenant structure by monitoring incoming emails and new form entries. Below we describe the structure of this module.

### Email Monitoring

We utilize IMAP for monitoring incoming emails, specifically, using IMAP IDLE command for watching incoming emails. Additionally, we use `quoted-printable` for decoding the Chinese characters properly from the email to utf-8.

### Utils

- **db_\***: These functions are associated with database operations. They simplify adding or deleting rows from the database.

- **character_decode**: This function decodes Chinese characters to utf-8 for displaying them.

- **fs_\***: These functions create or read files on the filesystem, like creating a CSV file.
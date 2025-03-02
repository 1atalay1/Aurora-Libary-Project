# Aurora-Libary-Project
Full Stack Libary Project 

Before using this project make sure you install all the must modules with npm i command and create proper table.

This project is fully responsive, ensuring seamless usability across various devices, including computers and mobile phones.
For the front end, I utilized Bootstrap for a responsive layout, EJS for dynamic templating, and custom CSS for styling and design refinements. On the back end, I implemented Node.js (Express) for efficient server-side operations and PostgreSQL for reliable data management.

Reader Operations
=================
**Sign up**
2)Update account details or delete their account (only if they have returned all borrowed books)
3)List all books or search for specific books based on a query
4)Borrow books (up to 5 books at a time, provided they do not already have 5 books checked out)
5)Return borrowed books
6)View current loans
7)View borrowing history
8)Send feedback to a worker

Worker Operations
================
1)List all readers or search for specific readers based on a query
2)Delete reader accounts (only if the reader currently has no borrowed books)
3)View all feedback or search for specific feedback based on a query (only managers or admins can delete feedback)
4)View the borrowing history of all readers or search for a specific reader’s borrowing history
5)View all current loans of all readers or search for a specific reader’s current loans
6)List all books in the system or search for specific books based on a query
7)Add new books to the system
8)Increase or decrease the quantity of existing books in the system
9)List all workers or search for specific workers based on a query (only admins or managers)
10)Update worker information (only admins or managers)
11)Delete worker accounts (only admins or managers)
12)Add new workers (only admins or managers)


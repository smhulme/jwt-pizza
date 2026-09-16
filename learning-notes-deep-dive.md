# JWT Pizza — Complete Architecture & Activity Deep Dive

This document provides a comprehensive, step-by-step technical explanation for every user activity listed in the [`notes.md`](./notes.md) table for **Deliverable ⓵ Development deployment: JWT Pizza** (BYU CS 329).

---

## High-Level Architecture Overview

JWT Pizza consists of three major architectural pieces:
1. **Frontend (`jwt-pizza`)**: Built using React, Vite, TypeScript, Tailwind CSS, and Preline UI. It maintains user session state and communicates with backend APIs via `httpPizzaService.ts`.
2. **Backend Service (`jwt-pizza-service`)**: Node.js and Express server running on port 3000. It manages authentication tokens using JSON Web Tokens (JWT), provides CRUD endpoints, and interfaces with MySQL.
3. **Database (MySQL)**: Stores relational data across tables: `user`, `userRole`, `auth`, `menu`, `franchise`, `store`, `dinerOrder`, and `orderItem`.
4. **External Pizza Factory (`https://pizza-factory.cs329.click`)**: A third-party simulated service that creates orders and cryptographically signs/verifies JWT tokens representing purchased pizzas.

---

## Complete Notes Table Summary

| User activity | Frontend component | Backend endpoints | Database SQL |
| :--- | :--- | :--- | :--- |
| **View home page** | `home.tsx` | *none* | *none* |
| **Register new user**<br/>(`t@jwt.com`, pw: `test`) | `register.tsx` | `[POST] /api/auth` | `INSERT INTO user (name, email, password) VALUES (?, ?, ?)`<br/>`INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)` |
| **Login new user**<br/>(`t@jwt.com`, pw: `test`) | `login.tsx` | `[PUT] /api/auth` | `SELECT * FROM user WHERE email=?`<br/>`SELECT * FROM userRole WHERE userId=?` |
| **Order pizza** | `menu.tsx`<br/>`payment.tsx` | `[GET] /api/order/menu`<br/>`[POST] /api/order` | `SELECT * FROM menu`<br/>`INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())`<br/>`INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)` |
| **Verify pizza** | `delivery.tsx` | `[POST] /api/order/verify` | *none* |
| **View profile page** | `dinerDashboard.tsx` | `[GET] /api/order` | `SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=?`<br/>`SELECT id, menuId, description, price FROM orderItem WHERE orderId=?` |
| **View franchise**<br/>(as diner) | `franchiseDashboard.tsx` | `[GET] /api/franchise/:userId` | `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?` |
| **Logout** | `logout.tsx` | `[DELETE] /api/auth` | `DELETE FROM auth WHERE token=?` |
| **View About page** | `about.tsx` | *none* | *none* |
| **View History page** | `history.tsx` | *none* | *none* |
| **Login as franchisee**<br/>(`f@jwt.com`, pw: `franchisee`) | `login.tsx` | `[PUT] /api/auth` | `SELECT * FROM user WHERE email=?`<br/>`SELECT * FROM userRole WHERE userId=?` |
| **View franchise**<br/>(as franchisee) | `franchiseDashboard.tsx` | `[GET] /api/franchise/:userId` | `SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?`<br/>`SELECT id, name FROM franchise WHERE id in (?)`<br/>`SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'`<br/>`SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id` |
| **Create a store** | `createStore.tsx` | `[POST] /api/franchise/:franchiseId/store` | `INSERT INTO store (franchiseId, name) VALUES (?, ?)` |
| **Close a store** | `closeStore.tsx` | `[DELETE] /api/franchise/:franchiseId/store/:storeId` | `DELETE FROM store WHERE franchiseId=? AND id=?` |
| **Login as admin**<br/>(`a@jwt.com`, pw: `admin`) | `login.tsx` | `[PUT] /api/auth` | `SELECT * FROM user WHERE email=?`<br/>`SELECT * FROM userRole WHERE userId=?` |
| **View Admin page** | `adminDashboard.tsx` | `[GET] /api/franchise` | `SELECT id, name FROM franchise WHERE name LIKE ?`<br/>`SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'`<br/>`SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id` |
| **Create a franchise for t@jwt.com** | `createFranchise.tsx` | `[POST] /api/franchise` | `SELECT id, name FROM user WHERE email=?`<br/>`INSERT INTO franchise (name) VALUES (?)`<br/>`INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)` |
| **Close the franchise for t@jwt.com** | `closeFranchise.tsx` | `[DELETE] /api/franchise/:franchiseId` | `DELETE FROM store WHERE franchiseId=?`<br/>`DELETE FROM userRole WHERE objectId=?`<br/>`DELETE FROM franchise WHERE id=?` |

---

## Detailed Step-by-Step Breakdown by Activity

---

### 1. View Home Page

* **Frontend Component**: `src/views/home.tsx`
  * Renders a static hero image, testimonials carousel, and introduction paragraphs describing JWT Pizza.
  * Contains an "Order now" button that redirects the browser to the `/menu` route.
* **Network & Backend**:
  * No network API calls are made during the initial rendering of this component.
  * **Backend Endpoints**: `*none*`
* **Database SQL**:
  * **Database SQL**: `*none*`

---

### 2. Register New User (`t@jwt.com`, pw: `test`)

* **Frontend Component**: `src/views/register.tsx`
  * Captures `name`, `email`, and `password` via controlled React form inputs.
  * Submitting the form calls `pizzaService.register(name, email, password)` in `httpPizzaService.ts`.
  * Sends an HTTP request: `POST http://localhost:3000/api/auth` with JSON payload `{ name, email, password }`.
  * Upon receiving `{ user, token }`, the JWT is saved to browser storage: `localStorage.setItem('token', token)`.
* **Backend Endpoint**: `[POST] /api/auth` (`authRouter.js`)
  * Validates that `name`, `email`, and `password` are present in `req.body`.
  * Invokes `DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] })`.
  * Calls `setAuth(user)`, which signs a JWT token using `config.jwtSecret` and logs the session in the database.
* **Database SQL**:
  1. Hashes the user password using `bcrypt.hash(user.password, 10)`.
  2. Inserts the user record:
     ```sql
     INSERT INTO user (name, email, password) VALUES (?, ?, ?)
     ```
  3. Inserts the default diner role for the new user (`insertId`):
     ```sql
     INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)
     ```
  4. (*Session persistence* in `loginUser`):
     ```sql
     INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token
     ```

---

### 3. Login New User (`t@jwt.com`, pw: `test`)

* **Frontend Component**: `src/views/login.tsx`
  * Captures `email` and `password`.
  * Submits via `pizzaService.login(email, password)` in `httpPizzaService.ts`.
  * Sends an HTTP request: `PUT http://localhost:3000/api/auth` with body `{ email, password }`.
  * Saves the returned JWT to `localStorage.setItem('token', token)` and updates application state with `user`.
* **Backend Endpoint**: `[PUT] /api/auth` (`authRouter.js`)
  * Reads credentials from `req.body`.
  * Calls `DB.getUser(email, password)`.
  * Calls `setAuth(user)` to sign the JWT and store token state.
* **Database SQL**:
  1. Fetches user details by email:
     ```sql
     SELECT * FROM user WHERE email=?
     ```
  2. Compares the submitted password with the database bcrypt hash (`bcrypt.compare`).
  3. Retrieves all roles assigned to this user:
     ```sql
     SELECT * FROM userRole WHERE userId=?
     ```
  4. (*Session tracking*):
     ```sql
     INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token
     ```

---

### 4. Order Pizza

* **Frontend Components**: `src/views/menu.tsx` and `src/views/payment.tsx`
  * **Step A (`menu.tsx`)**: Fetches menu items via `pizzaService.getMenu()` and available stores via `pizzaService.getFranchises()`. The diner picks a store and pizzas to add to their cart, then clicks "Checkout" (navigating to `/payment`).
  * **Step B (`payment.tsx`)**: Displays the order summary and pricing. Clicking "Pay now" calls `pizzaService.order(order)`.
* **Backend Endpoints**:
  * `[GET] /api/order/menu` (`orderRouter.js`): Returns available pizza options.
  * `[POST] /api/order` (`orderRouter.js`): Receives `{ franchiseId, storeId, items }`. Authenticates the diner via JWT.
* **Database SQL**:
  1. Menu retrieval:
     ```sql
     SELECT * FROM menu
     ```
  2. Create parent order header:
     ```sql
     INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())
     ```
  3. For each pizza line item in the order:
     ```sql
     INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?)
     ```
* **Third-Party Integration**:
  * The backend sends a request to the external Pizza Factory (`POST https://pizza-factory.cs329.click/api/order`), which returns a confirmation JWT verifying the order.

---

### 5. Verify Pizza

* **Frontend Component**: `src/views/delivery.tsx`
  * After payment, the user is navigated to `/delivery` with the order and the confirmation JWT.
  * Clicking the "Verify" button triggers `pizzaService.verifyOrder(jwt)`.
* **Network & Service**:
  * In `httpPizzaService.ts`, `verifyOrder` calls:
    ```typescript
    this.callEndpoint(pizzaFactoryUrl + '/api/order/verify', 'POST', { jwt })
    ```
  * Because `pizzaFactoryUrl` is an absolute URL (`https://pizza-factory.cs329.click`), the request goes directly to the Pizza Factory.
* **Backend Endpoint**: `[POST] /api/order/verify` (hosted on external Pizza Factory).
* **Database SQL**: `*none*`
  * Verifying a JWT is purely a cryptographic signature check against the secret/public key. No database queries are run on either the local service or the factory.

---

### 6. View Profile Page

* **Frontend Component**: `src/views/dinerDashboard.tsx`
  * Reached by clicking the user avatar/initials in the top navigation header (`header.tsx`).
  * In `useEffect`, it calls `pizzaService.getOrders(user)`.
* **Backend Endpoint**: `[GET] /api/order` (`orderRouter.js`)
  * Protected by `authRouter.authenticateToken`.
  * Calls `DB.getOrders(req.user, req.query.page)`.
* **Database SQL**:
  1. Fetches diner orders with pagination:
     ```sql
     SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ...
     ```
  2. For each order found, loads its order items:
     ```sql
     SELECT id, menuId, description, price FROM orderItem WHERE orderId=?
     ```

---

### 7. View Franchise (as Diner)

* **Frontend Component**: `src/views/franchiseDashboard.tsx`
  * Reached by navigating to `/franchise-dashboard`.
  * When mounted, calls `pizzaService.getFranchise(props.user)` which sends `GET /api/franchise/:userId`.
* **Backend Endpoint**: `[GET] /api/franchise/:userId` (`franchiseRouter.js`)
  * Calls `DB.getUserFranchises(userId)`.
* **Database SQL**:
  * Checks if the user has any franchisee role associations:
    ```sql
    SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?
    ```
  * Because a regular diner has no franchisee records, this returns `[]` immediately without executing further franchise lookup queries.
  * The frontend receives an empty array and renders the informational "Why franchise with JWT Pizza?" marketing screen.

---

### 8. Logout

* **Frontend Component**: `src/views/logout.tsx`
  * Reached when clicking "Logout" in the navigation bar.
  * In `useEffect`, executes `pizzaService.logout()`, resets application user state to `null`, and navigates to the home page `/`.
* **Backend Endpoint**: `[DELETE] /api/auth` (`authRouter.js`)
  * Validates the bearer token signature with `authRouter.authenticateToken`.
  * Calls `DB.logoutUser(token)`.
* **Database SQL**:
  * Deletes the session token from the `auth` table:
    ```sql
    DELETE FROM auth WHERE token=?
    ```

---

### 9. View About Page

* **Frontend Component**: `src/views/about.tsx`
  * Displays company mission, description of employees, and illustrative stock photos.
  * Static presentation component.
* **Backend Endpoints**: `*none*`
* **Database SQL**: `*none*`

---

### 10. View History Page

* **Frontend Component**: `src/views/history.tsx`
  * Displays the backstory and history of Mama Ricci's kitchen.
  * Static presentation component.
* **Backend Endpoints**: `*none*`
* **Database SQL**: `*none*`

---

### 11. Login as Franchisee (`f@jwt.com`, pw: `franchisee`)

* **Frontend Component**: `src/views/login.tsx`
  * The franchisee enters `f@jwt.com` and password `franchisee`.
  * Submits via `pizzaService.login(email, password)`.
* **Backend Endpoint**: `[PUT] /api/auth` (`authRouter.js`)
  * Authenticates the user credentials and signs an authorization JWT with role `franchisee` included in `roles`.
* **Database SQL**:
  1. Looks up the franchisee account:
     ```sql
     SELECT * FROM user WHERE email=?
     ```
  2. Compares password hash via `bcrypt.compare`.
  3. Retrieves the franchisee user roles (which includes `role: 'franchisee'`, `objectId: <franchiseId>`):
     ```sql
     SELECT * FROM userRole WHERE userId=?
     ```
  4. Records the session in the `auth` table:
     ```sql
     INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token
     ```

---

### 12. View Franchise (as Franchisee)

* **Frontend Component**: `src/views/franchiseDashboard.tsx`
  * Mounted when viewing `/franchise-dashboard` as a logged-in franchisee.
  * Calls `pizzaService.getFranchise(user)` -> `GET /api/franchise/:userId`.
* **Backend Endpoint**: `[GET] /api/franchise/:userId` (`franchiseRouter.js`)
  * Executes `DB.getUserFranchises(userId)`.
* **Database SQL**:
  1. Finds the franchise IDs this user administers:
     ```sql
     SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?
     ```
  2. Fetches franchise records:
     ```sql
     SELECT id, name FROM franchise WHERE id in (?)
     ```
  3. Inside `DB.getFranchise`:
     * Retrieves all franchise admins:
       ```sql
       SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'
       ```
     * Retrieves all stores under this franchise along with total accumulated revenue computed from order items:
       ```sql
       SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id
       ```

---

### 13. Create a Store

* **Frontend Component**: `src/views/createStore.tsx`
  * Opened from the franchise dashboard ("Create store" button).
  * The franchisee inputs the store name and submits the form.
  * Calls `pizzaService.createStore(franchise, store)` in `httpPizzaService.ts`.
* **Backend Endpoint**: `[POST] /api/franchise/:franchiseId/store` (`franchiseRouter.js`)
  * Checks that the requesting user is either an Admin or listed as an admin of the target franchise.
  * Invokes `DB.createStore(franchise.id, req.body)`.
* **Database SQL**:
  * Inserts the new store record linked to the franchise:
    ```sql
    INSERT INTO store (franchiseId, name) VALUES (?, ?)
    ```

---

### 14. Close a Store

* **Frontend Component**: `src/views/closeStore.tsx`
  * Opened when clicking "Close" next to a store on the dashboard.
  * Clicking the confirmation "Close" button triggers `pizzaService.closeStore(franchise, store)`.
* **Backend Endpoint**: `[DELETE] /api/franchise/:franchiseId/store/:storeId` (`franchiseRouter.js`)
  * Checks authorization permissions.
  * Calls `DB.deleteStore(franchiseId, storeId)`.
* **Database SQL**:
  * Deletes the store from the database:
    ```sql
    DELETE FROM store WHERE franchiseId=? AND id=?
    ```

---

### 15. Login as Admin (`a@jwt.com`, pw: `admin`)

* **Frontend Component**: `src/views/login.tsx`
  * Admin enters `a@jwt.com` and password `admin`.
  * Submits via `pizzaService.login(email, password)`.
* **Backend Endpoint**: `[PUT] /api/auth` (`authRouter.js`)
  * Validates credentials and returns JWT with role `'admin'`.
* **Database SQL**:
  1. Look up user record:
     ```sql
     SELECT * FROM user WHERE email=?
     ```
  2. Verify bcrypt password hash.
  3. Load admin role:
     ```sql
     SELECT * FROM userRole WHERE userId=?
     ```
  4. Store session token:
     ```sql
     INSERT INTO auth (token, userId) VALUES (?, ?) ON DUPLICATE KEY UPDATE token=token
     ```

---

### 16. View Admin Page

* **Frontend Component**: `src/views/adminDashboard.tsx`
  * Accessed via the "Admin" link in the navigation header (only displayed if user has admin role).
  * In `useEffect`, calls `pizzaService.getFranchises(franchisePage, 3, '*')`.
* **Backend Endpoint**: `[GET] /api/franchise` (`franchiseRouter.js`)
  * Route: `GET /api/franchise?page=0&limit=3&name=*`
  * Calls `DB.getFranchises(req.user, page, limit, nameFilter)`.
* **Database SQL**:
  1. Searches all franchise records matching filter:
     ```sql
     SELECT id, name FROM franchise WHERE name LIKE ?
     ```
  2. For each franchise, because `authUser.isRole(Role.Admin)` is true, it calls `DB.getFranchise`:
     * Queries franchise admins:
       ```sql
       SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee'
       ```
     * Queries stores and calculates total revenue:
       ```sql
       SELECT s.id, s.name, COALESCE(SUM(oi.price), 0) AS totalRevenue FROM dinerOrder AS do JOIN orderItem AS oi ON do.id=oi.orderId RIGHT JOIN store AS s ON s.id=do.storeId WHERE s.franchiseId=? GROUP BY s.id
       ```

---

### 17. Create a Franchise for `t@jwt.com`

* **Frontend Component**: `src/views/createFranchise.tsx`
  * Reached from the Admin Dashboard by clicking "Create franchise".
  * Admin inputs the new franchise name and assigns the admin email (`t@jwt.com`).
  * Submits via `pizzaService.createFranchise(franchise)` -> `POST /api/franchise`.
* **Backend Endpoint**: `[POST] /api/franchise` (`franchiseRouter.js`)
  * Middleware confirms `req.user.isRole(Role.Admin)`.
  * Calls `DB.createFranchise(franchise)`.
* **Database SQL**:
  1. Looks up the designated franchisee admin user by email (`t@jwt.com`):
     ```sql
     SELECT id, name FROM user WHERE email=?
     ```
  2. Inserts the franchise record:
     ```sql
     INSERT INTO franchise (name) VALUES (?)
     ```
  3. Assigns the `franchisee` role to `t@jwt.com` referencing the new `franchise.id`:
     ```sql
     INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?)
     ```

---

### 18. Close the Franchise for `t@jwt.com`

* **Frontend Component**: `src/views/closeFranchise.tsx`
  * Reached from the Admin Dashboard by clicking the "Close" button next to the franchise.
  * Clicking the confirmation "Close" button calls `pizzaService.closeFranchise(franchise)` in `httpPizzaService.ts`.
* **Backend Endpoint**: `[DELETE] /api/franchise/:franchiseId` (`franchiseRouter.js`)
  * Calls `DB.deleteFranchise(franchiseId)`.
* **Database SQL**:
  * Executed inside a database transaction (`beginTransaction` / `commit`):
    1. Removes all child stores belonging to the franchise:
       ```sql
       DELETE FROM store WHERE franchiseId=?
       ```
    2. Removes all role associations tied to this franchise:
       ```sql
       DELETE FROM userRole WHERE objectId=?
       ```
    3. Deletes the franchise itself:
       ```sql
       DELETE FROM franchise WHERE id=?
       ```

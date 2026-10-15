import { test, expect } from "playwright-test-coverage";

test("updateUser", async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  let user = {
    id: 1,
    name: "pizza diner",
    email: email,
    roles: [{ role: "diner" }],
  };

  await page.route("*/**/api/auth", async (route) => {
    const method = route.request().method();
    if (method === "POST" || method === "PUT") {
      await route.fulfill({
        json: {
          user,
          token: "diner-token",
        },
      });
    } else if (method === "DELETE") {
      await route.fulfill({
        json: { message: "logout successful" },
      });
    } else {
      await route.continue();
    }
  });

  await page.route("*/**/api/user/*", async (route) => {
    if (route.request().method() === "PUT") {
      const data = route.request().postDataJSON();
      user = { ...user, ...data };
      await route.fulfill({
        json: {
          user,
          token: "diner-token",
        },
      });
    } else {
      await route.continue();
    }
  });

  await page.route("*/**/api/order*", async (route) => {
    await route.fulfill({
      json: { orders: [], more: false },
    });
  });

  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("pizza diner");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Register" }).click();

  // 'pd' are initials linking to the user dashboard
  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza diner");

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.locator("h3")).toContainText("Edit user");
  await page.getByRole("textbox").first().fill("pizza dinerx");
  await page.getByRole("button", { name: "Update" }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: "attached" });

  await expect(page.getByRole("main")).toContainText("pizza dinerx");
  await page.getByRole("link", { name: "Logout" }).click();
  await page.getByRole("link", { name: "Login" }).click();

  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("diner");
  await page.getByRole("button", { name: "Login" }).click();

  await page.getByRole("link", { name: "pd" }).click();

  await expect(page.getByRole("main")).toContainText("pizza dinerx");
});

test("admin can list, filter, and delete users", async ({ page }) => {
  let users = [
    {
      id: 4,
      name: "Admin User",
      email: "a@jwt.com",
      roles: [{ role: "admin" }],
    },
    {
      id: 3,
      name: "Kai Chen",
      email: "d@jwt.com",
      roles: [{ role: "diner" }],
    },
  ];

  await page.route("*/**/api/user/me", async (route) => {
    await route.fulfill({
      json: {
        id: 4,
        name: "Admin User",
        email: "a@jwt.com",
        roles: [{ role: "admin" }],
      },
    });
  });

  await page.route("*/**/api/franchise*", async (route) => {
    await route.fulfill({ json: { franchises: [], more: false } });
  });

  await page.route("*/**/api/user/*", async (route) => {
    if (route.request().url().includes("/api/user/me")) {
      return route.fallback();
    }
    if (route.request().method() === "DELETE") {
      const url = new URL(route.request().url());
      const parts = url.pathname.split("/");
      const idToDelete = Number(parts[parts.length - 1]);
      users = users.filter((u) => u.id !== idToDelete);
      await route.fulfill({ json: { message: "user deleted" } });
    } else {
      await route.continue();
    }
  });

  await page.route("*/**/api/user?*", async (route) => {
    const url = new URL(route.request().url());
    const nameFilter = url.searchParams.get("name") || "*";

    if (route.request().method() === "GET") {
      let filtered = users;
      if (nameFilter !== "*") {
        const cleanFilter = nameFilter.replace(/\*/g, "");
        filtered = users.filter((u) => u.name.includes(cleanFilter));
      }
      await route.fulfill({ json: { users: filtered, more: false } });
    } else {
      await route.continue();
    }
  });

  await page.route("*/**/api/auth", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({
        json: {
          user: {
            id: 4,
            name: "Admin User",
            email: "a@jwt.com",
            roles: [{ role: "admin" }],
          },
          token: "admin-token",
        },
      });
    } else {
      await route.continue();
    }
  });

  // 1. Login as admin
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("a@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("admin");
  await page.getByRole("button", { name: "Login" }).click();

  // 2. Navigate to Admin Dashboard
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  // 3. Verify user list displays "Kai Chen"
  await expect(page.getByRole("main")).toContainText("Kai Chen");

  // 4. Test filtering users
  const filterInput = page.getByPlaceholder("Filter users");
  await filterInput.fill("Kai");
  await page.getByRole("button", { name: "Submit" }).nth(1).click();
  await expect(page.getByRole("main")).toContainText("Kai Chen");

  // 5. Test deleting user with confirmation modal
  const userRow = page.locator("tr", { hasText: "Kai Chen" });
  await userRow.getByRole("button", { name: "Delete" }).click();

  // Confirm delete modal appears and confirm button is clicked
  const confirmModal = page.locator("#confirm-delete-user-modal");
  await expect(confirmModal).toBeVisible();
  await confirmModal.getByRole("button", { name: "Confirm" }).click();

  // Verify user is removed from table
  await expect(page.locator("tr", { hasText: "Kai Chen" })).toHaveCount(0);
});



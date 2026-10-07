import { test, expect } from "playwright-test-coverage";
import { Page } from "@playwright/test";

async function basicInit(page: Page) {
  let loggedInUser: any;
  const validUsers: Record<string, any> = {
    "d@jwt.com": {
      id: 3,
      name: "Kai Chen",
      email: "d@jwt.com",
      password: "a",
      roles: [{ role: "diner" }],
    },
    "test@test.com": {
      id: 233,
      name: "test",
      email: "test@test.com",
      password: "test",
      roles: [{ role: "diner" }],
    },
  };

  await page.route("*/**/api/order/menu", async (route) => {
    const menuRes = [
      { id: 1, title: "Veggie", image: "pizza1.png", price: 0.0038, description: "A garden of delight" },
      { id: 2, title: "Pepperoni", image: "pizza2.png", price: 0.0042, description: "Spicy treat" },
      { id: 3, title: "Margarita", image: "pizza3.png", price: 0.0042, description: "Essential classic" },
      { id: 4, title: "Crusty", image: "pizza4.png", price: 0.0028, description: "A dry mouthed favorite" },
    ];
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: menuRes });
  });

  await page.route("*/**/api/franchise*", async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 1,
          name: "pizzaPocket",
          stores: [
            {
              id: 1,
              name: "SLC",
            },
          ],
        },
      ],
      more: false,
    };
    expect(route.request().method()).toBe("GET");
    await route.fulfill({ json: franchiseRes });
  });

  await page.route("*/**/api/auth", async (route) => {
    const loginReq = route.request().postDataJSON();
    const user = validUsers[loginReq.email];
    if (!user || user.password !== loginReq.password) {
      await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      return;
    }
    loggedInUser = user;
    const loginRes = {
      user: {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email,
        roles: loggedInUser.roles,
      },
      token: "abcdef",
    };
    expect(route.request().method()).toBe("PUT");
    await route.fulfill({ json: loginRes });
  });

  await page.route("*/**/api/user/me", async (route) => {
    if (!loggedInUser) {
      await route.fulfill({ status: 401, json: { error: "Unauthorized" } });
      return;
    }
    await route.fulfill({
      json: {
        id: loggedInUser.id,
        name: loggedInUser.name,
        email: loggedInUser.email,
        roles: loggedInUser.roles,
      },
    });
  });
}

test("home page", async ({ page }) => {
  await page.goto("/");

  expect(await page.title()).toBe("JWT Pizza");
});

test("login", async ({ page }) => {
  await basicInit(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Login" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("d@jwt.com");
  await page.getByRole("textbox", { name: "Password" }).fill("a");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByRole("link", { name: "KC" })).toBeVisible();
});

test("purchase with login", async ({ page }) => {
  await basicInit(page);

  await page.route("*/**/api/order", async (route) => {
    const orderReq = {
      items: [
        {
          menuId: 2,
          description: "Pepperoni",
          price: 0.0042,
        },
      ],
      storeId: "1",
      franchiseId: 1,
    };
    const orderRes = {
      order: {
        items: [
          {
            menuId: 2,
            description: "Pepperoni",
            price: 0.0042,
          },
        ],
        storeId: "1",
        franchiseId: 1,
        id: 62,
      },
      jwt: "mocked-jwt",
    };
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Order now" }).click();
  await page.getByRole("combobox").selectOption("1");
  await page.getByRole("link", { name: "Image Description Pepperoni" }).click();
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("test@test.com");
  await page.getByRole("textbox", { name: "Password" }).fill("test");
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.getByRole("button", { name: "Verify" }).click();
  await page.getByRole("button", { name: "Close" }).click();
});

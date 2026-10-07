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
      { id: 5, title: "Charred Leopard", image: "pizza5.png", price: 0.0099, description: "For those with a darker side" },
      { id: 6, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 7, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 8, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 9, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 10, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 11, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 12, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 13, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 14, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 15, title: "Veggie Delight", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 16, title: "Veggie Delight odlbh", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 17, title: "Veggie Delight z6h4k", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 18, title: "Veggie Delight fmbbv", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 19, title: "Veggie Delight 2nsy6", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 20, title: "Veggie Delight zhvqs", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 21, title: "Veggie Delight dqgjr", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 22, title: "Veggie Delight yb6qk", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 23, title: "Veggie Delight 36kkl", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 24, title: "Veggie Delight dbzp0", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 25, title: "Veggie Delight za7e3", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 26, title: "Veggie Delight p6nfo", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 27, title: "Veggie Delight bdxc3", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 28, title: "Veggie Delight ibzi6", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 29, title: "Veggie Delight xg7v4", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 30, title: "Veggie Delight l5kwn", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 31, title: "Veggie Delight 65yhf", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 32, title: "Veggie Delight yydrp", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 33, title: "Veggie Delight 8h50l", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 34, title: "Veggie Delight x29fl", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 35, title: "Veggie Delight gn750", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 36, title: "Veggie Delight 5j5vi", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 37, title: "Veggie Delight vrne1", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 38, title: "Veggie Delight t67y2", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 39, title: "Veggie Delight 0o4t9", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 40, title: "Veggie Delight cjn71", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 41, title: "Veggie Delight b7n43", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 42, title: "Veggie Delight h6mvv", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
      { id: 43, title: "Veggie Delight ledq9", image: "pizza1.png", price: 0.005, description: "Mushrooms and peppers" },
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

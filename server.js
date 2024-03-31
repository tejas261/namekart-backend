import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pgPromise from "pg-promise";

dotenv.config();
const pgp = pgPromise();
const app = express();
const db = pgp(
  "postgres://snippets_078k_user:DWXAQ2NYiIeLeqgnsVi0tEp6PAMb6A1L@dpg-cntvi78l6cac73c8f4ug-a/snippets_078k"
);
console.log("DB connected");

app.use(
  cors({
    origin: "https://socioscraper.vercel.app",
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://socioscraper.vercel.app");
  next();
});

async function facebook(url) {
  const exists = await db.oneOrNone(`SELECT * FROM fbdata where link=$1`, [
    url,
  ]);
  if (exists) {
    return exists;
  } else {
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
      executablePath: (process.env.NODE_ENV = "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()),
    });
    const page = await browser.newPage();

    try {
      console.log(`Navigating to URL: ${url}`);
      await page.goto(`https://www.facebook.com/${url}`);
      await page.waitForSelector("div > div > div > div div+div");

      const name = await page.evaluate(
        () =>
          document.querySelector("div > div > div  > div > div > span > h1")
            .textContent
      );
      const followers = await page.evaluate(
        () =>
          document.querySelector("div > div > div > div > div > span > a")
            .textContent
      );
      const following = await page.evaluate(
        () =>
          document.querySelector("div > div > div > div > div > span > a + a")
            .textContent
      );
      const picURL = await page.evaluate(() =>
        document.querySelector("image").getAttribute("xlink:href")
      );

      await db.oneOrNone(
        `INSERT INTO fbdata (name,url,followers,following,link) VALUES ($1,$2,$3,$4,$5)`,
        [name, picURL, followers, following, url]
      );
      return {
        followers: followers,
        following: following,
        name: name,
        url: picURL,
      };
    } catch (error) {
      console.error("Error:", error);
    } finally {
      await browser.close();
    }
  }
}

async function instagram(url) {
  const exists = await db.oneOrNone(`SELECT * FROM instadata where link=$1`, [
    url,
  ]);
  if (exists) {
    return exists;
  } else {
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
      executablePath: (process.env.NODE_ENV = "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()),
    });
    const page = await browser.newPage();

    try {
      console.log(`Navigating to URL: ${url}`);
      await page.goto(`https://www.instagram.com/${url}`);
      await page.waitForSelector("header > section");

      const followers = await page.evaluate(() => {
        return document.querySelector("header > section > ul > li + li")
          .textContent;
      });

      const following = await page.evaluate(() => {
        return document.querySelector("header > section > ul > li + li + li")
          .textContent;
      });

      const posts = await page.evaluate(() => {
        return document.querySelector("header > section >  ul > li")
          .textContent;
      });

      const name = await page.evaluate(() => {
        return document.querySelector("header > section > div > div > span")
          .textContent;
      });

      const username = await page.evaluate(() => {
        return document.querySelector("header > section > div > div > h2")
          .textContent;
      });

      const picURL = await page.evaluate(() => {
        return document
          .querySelector("header > div > div > span > img")
          .getAttribute("src");
      });

      await db.oneOrNone(
        `INSERT INTO instadata (name,url,followers,following,posts,username,link) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [name, picURL, followers, following, posts, "@" + username, url]
      );

      return {
        followers: followers,
        following: following,
        name: name,
        posts: posts,
        username: "@" + username,
        url: picURL,
      };
    } catch (error) {
      console.error("Error:", error);
    } finally {
      await browser.close();
    }
  }
}

async function twitter(url) {
  const exists = await db.oneOrNone(`SELECT * FROM twitterdata where link=$1`, [
    url,
  ]);
  if (exists) {
    return exists;
  } else {
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
      ],
      executablePath: (process.env.NODE_ENV = "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()),
    });
    const page = await browser.newPage();
    try {
      console.log(`Navigating to URL: ${url}`);
      await page.goto(`https://www.twitter.com/${url}`);
      await page.waitForSelector(
        "div > div + div > a > span > span:nth-child(1)"
      );

      const posts = await page.evaluate(() => {
        return document.querySelector("div > div > h2 + div").textContent;
      });

      const followers = await page.evaluate(() => {
        return document.querySelector(
          "div > div + div > a > span > span:nth-child(1)"
        ).textContent;
      });
      const following = await page.evaluate(() => {
        return document.querySelector(
          "div > div  > a > span > span:nth-child(1)"
        ).textContent;
      });
      const name = await page.evaluate(() => {
        return document.querySelector(
          "div > div + div >div>div>div>div>div>span>span"
        ).textContent;
      });
      const username = await page.evaluate(() => {
        return document.querySelector("div > div + div >div>div>div>span")
          .textContent;
      });
      const picURL = await page.evaluate(() => {
        return document
          .querySelector('img[alt="Opens profile photo"]')
          .getAttribute("src");
      });

      await db.oneOrNone(
        `INSERT INTO twitterdata (name,url,followers,following,username,posts,link) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          name,
          picURL,
          followers + " Followers",
          following + " Following",
          username,
          posts,
          url,
        ]
      );

      return {
        posts: posts,
        followers: followers + " Followers",
        following: following + " Following",
        name: name,
        username: username,
        url: picURL,
      };
    } catch (error) {
      console.error("Error:", error);
    } finally {
      await browser.close();
    }
  }
}

app.post("/twitter", async (req, res) => {
  const { twitterurl } = req.body;
  try {
    const response = await twitter(twitterurl);
    return res.status(200).json({ message: "Success", data: response });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Error occurred!" });
  }
});

app.post("/fb", async (req, res) => {
  const { fburl } = req.body;
  try {
    const response = await facebook(fburl);
    return res.status(200).json({ message: "Success!!", data: response });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Error occured!" });
  }
});

app.post("/insta", async (req, res) => {
  const { instaurl } = req.body;
  try {
    const response = await instagram(instaurl);
    return res.status(200).json({ message: "Success", data: response });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Error occured!" });
  }
});

app.listen(8000, () => console.log("Server started"));
